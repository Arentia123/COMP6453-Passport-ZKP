import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getDeployment } from "./deployment";
import { calcLeaf, genCertProof, getPubkey } from "./genProof";

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

export { addCert };