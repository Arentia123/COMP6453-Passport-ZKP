import fs from "fs/promises";
import { genCertProof, calcLeaf, getPubkey } from "./genProof";
import { CERT_DIR, DEFAULT_CA_CERT, DEFAULT_DS_CERT } from "./constants";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy = async (args: any, hre: HardhatRuntimeEnvironment) => {
    // setup PKI - all CSCA certificates in certs/csca and DS certificates in certs/ds
    const cscaFiles = await fs.readdir(`${CERT_DIR}/csca`);
    let dsSignerPubkeyLeaf = 0n;
    const cscaPubkeyLeaves: bigint[] = [];
    for (const file of cscaFiles) {
        const n = await getPubkey(`${CERT_DIR}/csca/${file}`);
        const leaf = calcLeaf(n);
        cscaPubkeyLeaves.push(leaf);

        if (file == DEFAULT_CA_CERT)
            dsSignerPubkeyLeaf = leaf;
    }

    const poseidon = await hre.ethers.deployContract("PoseidonT3");
    const leanImt = await hre.ethers.deployContract(
        "LeanIMT", 
        { libraries: { PoseidonT3: await poseidon.getAddress() } }
    );
    const cVV = await hre.ethers.deployContract("CertVerificationVerifier");
    const cV = await hre.ethers.deployContract("CertVerifier", [await cVV.getAddress()]);
    const cR = await hre.ethers.deployContract(
        "CertificateRegistry", 
        [cscaPubkeyLeaves, await cV.getAddress()],
        { libraries: { LeanIMT: await leanImt.getAddress() } }
    );
    const pVV = await hre.ethers.deployContract("PassportVerificationVerifier");
    const pV = await hre.ethers.deployContract(
        "PassportVerifier", 
        [await pVV.getAddress(), await cR.getAddress()]
    );

    const contractAddresses = {
        Poseidon: await poseidon.getAddress(),
        LeanIMT: await leanImt.getAddress(),
        CertVerificationVerifier: await cVV.getAddress(),
        CertVerifier: await cV.getAddress(),
        CertificateRegistry: await cR.getAddress(),
        PassportVerificationVerifier: await pVV.getAddress(),
        PassportVerifier: await pV.getAddress(),
    };

    for (const [contract, addr] of Object.entries(contractAddresses))
        console.log(`${contract} deployed at ${addr}`);

    // generate proof for inserting DS ds.pem
    const caLeaves = (await cR.getAllCALeaves()).map(leaf => leaf.toString());
    const caIdx = parseInt((await cR.getIdxOfCA(dsSignerPubkeyLeaf)).toString());

    const dsProof = await genCertProof(
        `${CERT_DIR}/csca/${DEFAULT_CA_CERT}`,
        `${CERT_DIR}/ds/${DEFAULT_DS_CERT}`,
        caLeaves, 
        caIdx
    );
    await cR.addDS_Certificate(dsProof);

    await fs.writeFile("./scripts/deploymentAddresses.json", JSON.stringify(contractAddresses, null, 4));

    console.log("Contracts deployed and DS certificate added to registry!");
};

export { deploy };