import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getDeployment } from "./deployment";
import { calcLeaf, genCertProof, getPubkey } from "./genProof";
import forge from "node-forge";
import fs from "fs/promises";

const genCert = async (args: any) => {
    const key = forge.pki.rsa.generateKeyPair(2048, 65537);
    const cert = forge.pki.createCertificate();
    cert.serialNumber = BigInt.asUintN(
        160, 
        BigInt("0x" + forge.util.bytesToHex(forge.random.getBytesSync(20)))
    ).toString();
    cert.validity.notBefore = new Date(args.notBefore);
    cert.validity.notAfter = new Date(args.notAfter);
    const attrs = [
        { shortName: "C", value: "AU" },
        { shortName: "O", value: "GOV" },
        { shortName: "OU", value: "DFAT" },
        { shortName: "OU", value: args.type == "csca" ? "APO" : "PTB" },
        { shortName: "CN", value: "Passport Country Signing Authority" }
    ];
    cert.setSubject(attrs);
    cert.publicKey = key.publicKey;

    const issuerCert = forge.pki.certificateFromPem(await fs.readFile(args.issuer, "utf-8"));
    cert.setIssuer(issuerCert.subject.attributes);
    const issuerKey = forge.pki.privateKeyFromPem(await fs.readFile(args.key, "utf-8"));
    cert.sign(issuerKey, forge.md.sha256.create());

    await fs.writeFile(args.out, forge.pki.certificateToPem(cert));

    console.log("Certificate written to", args.out);
};

const addCert = async (args: any, hre: HardhatRuntimeEnvironment) => {
    const certType = args.type;
    if (!["csca", "ds"].includes(certType))
        throw new Error("Invalid certificate type");

    const issuerPubkey = calcLeaf(await getPubkey(args.issuer));

    const dep = await getDeployment(hre);
    const caLeaves = (await dep.certificateRegistry.getAllCALeaves()).map(leaf => leaf.toString());
    const caIdx = Number(await dep.certificateRegistry.getIdxOfCA(issuerPubkey));

    console.log("Generating certificate proof...");
    const proofStartTime = Date.now();
    const proof = await genCertProof(args.issuer, args.subject, caLeaves, caIdx);
    console.log(`Proof generation took ${Math.floor((Date.now() - proofStartTime) / 1000)} seconds`);

    if (certType === "csca")
        await dep.certificateRegistry.addCA_Certificate(proof);
    else
        await dep.certificateRegistry.addDS_Certificate(proof);

    console.log("Certificate added to registry!");
};

export { addCert, genCert };