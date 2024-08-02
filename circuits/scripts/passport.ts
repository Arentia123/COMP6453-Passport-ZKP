import fs from "fs/promises";
import forge from "node-forge";
import { getDeployment } from "./deployment";
import { genRandomPassportData, genPassportProof, calcLeaf, PassportData } from "./genProof";

import { HardhatRuntimeEnvironment } from "hardhat/types";

const genPassport = async (args: any) => {
    const passportData = await genRandomPassportData(
        args.cert, args.key, args.expiryDate, args.issuingState, args.firstname, 
        args.surname, args.docNumber, args.nationality, args.dob, args.sex,
        args.dg1Offset, args.preecontentSize, args.preecontentOffset, 
        args.econtentSize
    );
    await fs.writeFile(args.out, JSON.stringify(passportData, null, 4));
    console.log("Passport written to", args.out);
};

const provePassport = async (args: any, hre: HardhatRuntimeEnvironment) => {
    const passportData: PassportData = JSON.parse(await fs.readFile(args.passport, "utf-8"));

    const mrz = forge.util.decode64(passportData.dg1);
    console.log("Passport MRZ:\n")
    console.log(mrz.slice(5, 49));
    console.log(mrz.slice(49, 93));

    const cert = forge.pki.certificateFromAsn1(forge.asn1.fromDer(forge.util.decode64(passportData.cert)));
    const pubkey = calcLeaf(BigInt((cert.publicKey as forge.pki.rsa.PublicKey).n.toString()));

    const dep = await getDeployment(hre);
    if (!(await dep.certificateRegistry.proofDS(pubkey)))
        throw new Error("Passport holder's DS pubkey is not in the registry");

    const dsLeaves = (await dep.certificateRegistry.getAllDSLeaves()).map(leaf => leaf.toString());
    const dsIdx = Number(await dep.certificateRegistry.getIdxOfDS(pubkey));

    console.log("Generating passport proof...");
    const currTime = Number(args.time);
    const proofGenStartTime = Date.now();
    const proof = await genPassportProof(passportData, currTime + 100, dsLeaves, dsIdx);
    console.log(`Proof generation took ${Math.floor((Date.now() - proofGenStartTime) / 1000)} seconds`);

    await fs.writeFile(args.out, JSON.stringify(proof, null, 4));
    console.log("Proof written to", args.out);
};

// note that the passport must be valid at the local testnode time + 100 seconds
const verifyPassport = async (args: any, hre: HardhatRuntimeEnvironment) => {
    const proof = JSON.parse(await fs.readFile(args.proof, "utf-8"));
    const dep = await getDeployment(hre);
    const res = await dep.passportVerifier.verifyPassport(proof, args.timeBuffer);
    if (!res)
        throw new Error("Passport verification failed");

    console.log("Passport verified!");
};

export { provePassport, verifyPassport, genPassport };