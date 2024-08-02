import forge from "node-forge";
import fs from "fs/promises";
import { poseidon9 } from "poseidon-lite";
import { generateBinaryMerkleRoot } from "./utils/imtProofGen";
import { groth16 } from "snarkjs";
import { K, N, MAX_ECONTENT_SIZE, MAX_PREECONTENT_SIZE, MAX_DEPTH, MAX_TBS_CERT_SIZE } from "./constants";

// chunk into k n bit chunks
const numToKnbits = (num: bigint) => {
    const knbits = new Array(K);
    const mask = (1n << N) - 1n;
    for (let i = 0; i < K; i++) {
        knbits[i] = BigInt(num & mask);
        num >>= N;
    }

    return knbits.map(x => x.toString());
};

const packChunks = (chunks: string[] | bigint[]) => {
	const numPacked = Math.ceil(chunks.length / 2);
	const packed: string[] = new Array(numPacked);
	for (let i = 0; i < Math.floor(chunks.length / 2); i++)
		packed[i] = (BigInt(chunks[i * 2]) | (BigInt(chunks[i * 2 + 1]) << 121n)).toString();	

	if ((chunks.length & 1) == 1)
		packed[numPacked - 1] = chunks[chunks.length - 1].toString();

	return packed;
};

// msg must be hex string in big endian
// returns hex string representation of padded bytes 
const sha256Pad = (msg: string) => {
    const l = BigInt(msg.length * 4);
    let bits = BigInt("0x" + msg)

    if (l >= (1n << 65n))
        throw new Error("Message too long");

    bits = (bits << 1n) | 1n;
    const k = (((448n - l - 1n) % 512n) + 512n) % 512n;
    bits <<= BigInt(k);
    bits <<= 64n;
    bits |= l & ((1n << 65n) - 1n);

    return bits.toString(16);
}

const zeroPad = (data: string[], paddedLen: number) => {
    const l = data.length;
    if (l > paddedLen)
        throw new Error("Data too long");

    const padded = new Array(paddedLen);
    for (let i = 0; i < l; i++)
        padded[i] = data[i];
    for (let i = l; i < paddedLen; i++)
        padded[i] = "0";

    return padded;
}

// converts hex to array of byte signals 
const hexToSigArray = (hex: string) => {
    if (hex.slice(0, 2) === "0x") {
        hex = hex.slice(2);
    }

    const bytes: string[] = new Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2)
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16).toString();

    return bytes;
}

const addPoM = (inputs: any, leaves: string[], idx: number) => {
	// construct IMT with pubkey included
	const pubkeyHash = poseidon9(packChunks(inputs.pubkey)).toString();
	const imtData = generateBinaryMerkleRoot(MAX_DEPTH, leaves, idx);
	inputs.expected_root = imtData.root.toString();
	inputs.depth = imtData.depth.toString();
	inputs.indices = imtData.indices.map((index) => index.toString());
	inputs.siblings = imtData.siblings.map((sibling) => sibling.toString());
}

const genCalldata = async (inputs: any, wasmPath: string, zkeyPath: string) => {
    const { proof, publicSignals } = await groth16.fullProve(inputs, wasmPath, zkeyPath);
    const calldataRaw = await groth16.exportSolidityCallData(proof, publicSignals);
    return JSON.parse(`[${calldataRaw}]`);
};

const calcLeaf = (pubkey: bigint) => poseidon9(packChunks(numToKnbits(pubkey)));

const getPubkey = async (certFile: string) => {
    const cert = await fs.readFile(certFile, "utf-8");
    const x509Cert = forge.pki.certificateFromPem(cert);
    const n = (x509Cert.publicKey as forge.pki.rsa.PublicKey).n;

    return BigInt(n.toString());
}

// leaves - array of all leaves of the csca/parent IMT in order
// idx - index of the leaf in the IMT
const genCertProof = async (issuerCertPath: string, subjectCertPath: string, leaves: string[], idx: number) => {
    const cscaCert = await fs.readFile(issuerCertPath, "utf-8");
    const dsCert = await fs.readFile(subjectCertPath, "utf-8");

    const csca = forge.pki.certificateFromPem(cscaCert);
    const cscaPubkey = (csca.publicKey as forge.pki.rsa.PublicKey).n;

    const ds = forge.pki.certificateFromPem(dsCert);
    const dsPubkey = (ds.publicKey as forge.pki.rsa.PublicKey).n.toString(16);
    let dsTbsCert = forge.asn1.toDer(ds.tbsCertificate).toHex();
    const dsSig = BigInt("0x" + forge.util.binary.hex.encode(ds.signature));

    const certPubkeyOffset = dsTbsCert.search(dsPubkey) / 2;
    if (certPubkeyOffset === -1) {
        throw new Error("Failed to find pubkey in cert");
    }

    dsTbsCert = sha256Pad(dsTbsCert); 

    const inputs = {
        "tbs_cert": zeroPad(hexToSigArray(dsTbsCert), MAX_TBS_CERT_SIZE),
        "tbs_cert_size": (dsTbsCert.length / 2).toString(),
        "pubkey": numToKnbits(BigInt(cscaPubkey.toString())),
        "sig": numToKnbits(dsSig),
        "cert_pubkey_offset": certPubkeyOffset.toString(),
    };

    addPoM(inputs, leaves, idx);

    const calldata = await genCalldata(
        inputs, 
        "./proofs/CertVerification/CertVerification.wasm", 
        "./proofs/CertVerification/CertVerification.zkey"
    );

    return {
        a: calldata[0],
        b: calldata[1],
        c: calldata[2],
        expectedRoot: calldata[3][1],
        certPubkeyHash: calldata[3][0],
    };
};

// Source: https://github.com/Arg0s1080/mrz/blob/c462e0c8ca72f0396b9d1d17062434cd1c32b76a/mrz/base/functions.py#L19-L39
const getCheckDigit = (s: string) => {
    const printable = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    s = s.toUpperCase().replace(/</gi, '0');
    const weight = [7, 3, 1];
    let summation = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (!printable.includes(c))
            throw new Error(`Invalid character in string: ${c}`);
        summation += printable.indexOf(c) * weight[i % 3];
    }

    return (summation % 10).toString();
};

const genMRZ = (
    issuingState = "AUS", firstname = "JOHN", surname = "DOE", docNumber = "RA1234567",
    nationality = "AUS", dob = "000101", sex = "M", expiryDate = "320101"
) => {
    if (
        issuingState.length !== 3
        || firstname.length + surname.length > 37
        || docNumber.length !== 9
        || nationality.length !== 3
        || dob.length !== 6
        || sex.length !== 1
        || expiryDate.length !== 6
    ) 
        throw new Error("Invalid MRZ inputs");

    const names = surname + "<<" + firstname + '<'.repeat(39 - (firstname.length + surname.length + 2));
    const upperLine = "P<" + issuingState + names;
    let lowerLine = docNumber + getCheckDigit(docNumber) + nationality + dob 
                    + getCheckDigit(dob) + sex + expiryDate + getCheckDigit(expiryDate)
                    + '<'.repeat(14) + '0';
    lowerLine += getCheckDigit(lowerLine.slice(0, 10) + lowerLine.slice(13, 20) + lowerLine.slice(21, 43));

    return upperLine + lowerLine;
}

type PassportData = {
    "dg1": string,
    "pre-econtent": string,
    "econtent": string,
    "sig": string,
    "cert": string,
    [key: string]: any
};

const genRandomPassportData = async ( 
    signerCertFile: string, signerCertKeyFile: string, expiryDate = "320101", 
    issuingState = "AUS", firstname = "JOHN", surname = "DOE", docNumber = "RA1111111",
    nationality = "AUS", dob = "000101", sex = "M", dg1Offset = 29, 
    preecontentSize = 233, preecontentOffset = 42, econtentSize = 74
) => {
    if (dg1Offset + 32 > preecontentSize || preecontentOffset + 32 > econtentSize)
        throw new Error("Invalid offsets");

    let mrz = genMRZ(
        issuingState, firstname, surname, docNumber, nationality, dob, sex, expiryDate
    );
    mrz = forge.util.hexToBytes("615b5f1f58") + forge.util.createBuffer(mrz, "utf8").getBytes();

    let digest = forge.md.sha256.create();
    digest.update(mrz);
    let preecontent = forge.random.getBytesSync(preecontentSize);
    preecontent = preecontent.slice(0, dg1Offset) + digest.digest().getBytes() + preecontent.slice(dg1Offset + 32);

    digest = forge.md.sha256.create();
    digest.update(preecontent);
    let econtent = forge.random.getBytesSync(econtentSize);
    econtent = econtent.slice(0, preecontentOffset) + digest.digest().getBytes() + econtent.slice(preecontentOffset + 32);

    digest = forge.md.sha256.create();
    digest.update(econtent);

    // sign econtent
    const keyFile = await fs.readFile(signerCertKeyFile, "utf-8");
    const key = forge.pki.privateKeyFromPem(keyFile);

    const sig = key.sign(digest);

    const certFile = await fs.readFile(signerCertFile, "utf-8");
    const cert = forge.pki.pemToDer(certFile);

    const data: PassportData = {
        "dg1": forge.util.encode64(mrz),
        "pre-econtent": forge.util.encode64(preecontent),
        "econtent": forge.util.encode64(econtent),
        "sig": forge.util.encode64(sig),
        "cert": forge.util.encode64(cert.getBytes())
    };

    return data;
};

type PassportInputs = {
    dg1: string[],
    preecontent: string[],
    econtent: string[],
    sig: string[],
    pubkey: string[],
    dg1_offset: string,
    preecontent_size: string,
    preecontent_offset: string,
    econtent_size: string,
    current_timestamp: string
};

const genPassportProof = async (
    passportData: PassportData, currentTimestamp: number, dsLeaves: string[], dsIdx: number
) => {
    const dg1 = forge.util.decode64(passportData["dg1"]);
    let preecontent = forge.util.decode64(passportData["pre-econtent"]);
    let econtent = forge.util.decode64(passportData["econtent"]);
    const sig = forge.util.decode64(passportData["sig"]);

    let digest = forge.md.sha256.create();
    digest.update(dg1);
    const dg1Offset = forge.util.bytesToHex(preecontent).search(digest.digest().toHex()) / 2;

    digest = forge.md.sha256.create();
    digest.update(preecontent);
    const preecontentOffset = forge.util.bytesToHex(econtent).search(digest.digest().toHex()) / 2;

    const cert = forge.pki.certificateFromAsn1(forge.asn1.fromDer(forge.util.decode64(passportData["cert"])));
    const n = (cert.publicKey as forge.pki.rsa.PublicKey).n;
    digest = forge.md.sha256.create();
    digest.update(econtent);

    // check that our public key is correct
    const pk = forge.pki.setRsaPublicKey(n, new forge.jsbn.BigInteger("65537"));
    if (!pk.verify(digest.digest().getBytes(), sig))
        throw new Error("Invalid signature with given certificate pubkey");

    preecontent = sha256Pad(forge.util.bytesToHex(preecontent));
    econtent = sha256Pad(forge.util.bytesToHex(econtent));

    const inputs: PassportInputs = {
        "dg1": hexToSigArray(forge.util.bytesToHex(dg1)),
        "preecontent": zeroPad(hexToSigArray(preecontent), MAX_PREECONTENT_SIZE),
        "econtent": zeroPad(hexToSigArray(econtent), MAX_ECONTENT_SIZE),
        "sig": numToKnbits(BigInt("0x" + forge.util.bytesToHex(sig))),
        "pubkey": numToKnbits(BigInt(n.toString())),
        "dg1_offset": dg1Offset.toString(),
        "preecontent_size": (preecontent.length / 2).toString(),
        "preecontent_offset": preecontentOffset.toString(),
        "econtent_size": (econtent.length / 2).toString(),
        "current_timestamp": currentTimestamp.toString(),
    };

    addPoM(inputs, dsLeaves, dsIdx);

    const calldata = await genCalldata(
        inputs,
        "./proofs/PassportVerification/PassportVerification.wasm",
        "./proofs/PassportVerification/PassportVerification.zkey"
    );

    return {
        a: calldata[0],
        b: calldata[1],
        c: calldata[2],
        expectedRoot: calldata[3][0],
        currentTimestamp: calldata[3][1]
    };
}

export { genCertProof, calcLeaf, getPubkey, genRandomPassportData, genPassportProof, PassportData };