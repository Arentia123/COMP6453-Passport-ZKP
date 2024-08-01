import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import fs from "fs/promises";
import forge from "node-forge";
import process from "process";
import assert from "assert";
import { getDeployment } from "./deployment";
import { genRandomPassportData, genPassportProof, PassportData, calcLeaf } from "./genProof";

import { CERT_DIR, KEY_DIR, DEFAULT_DS_CERT, DEFAULT_DS_KEY, CONTRACT_ADDR_JSON } from "./constants";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const timestampToDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.getUTCFullYear().toString().slice(2) 
         + (date.getUTCMonth() + 1).toString().padStart(2, "0") 
         + date.getUTCDate().toString().padStart(2, "0");
};

// note that the passport must be valid for at least 3 more days
const provePassport = async (args: any, hre: HardhatRuntimeEnvironment) => {
    const currTime = await time.latest();
    const proofTime = currTime + 60 * 60 * 24 * 3;

    let passportData: PassportData;
    if (args.passportJson !== undefined) {
        const jsonFile = await fs.readFile(process.argv[process.argv.indexOf("--passportJson") + 1], "utf-8");
        passportData = JSON.parse(jsonFile);
    } else {
        passportData = await genRandomPassportData(
            `${CERT_DIR}/ds/${DEFAULT_DS_CERT}`, 
            `${KEY_DIR}/ds/${DEFAULT_DS_KEY}`, 
            timestampToDate(proofTime)
        );
        console.log("Generated random passport data");
    }

    const mrz = forge.util.decode64(passportData.dg1);
    console.log("Passport MRZ:")
    console.log(mrz.slice(5, 49));
    console.log(mrz.slice(49, 93));

    const cert = forge.pki.certificateFromAsn1(forge.asn1.fromDer(forge.util.decode64(passportData.cert)));
    const pubkey = calcLeaf(BigInt((cert.publicKey as forge.pki.rsa.PublicKey).n.toString()));

    const dep = await getDeployment(hre);
    assert(await dep.certificateRegistry.proofDS(pubkey), "DS pubkey not in registry");
    const dsLeaves = (await dep.certificateRegistry.getAllDSLeaves()).map(leaf => leaf.toString());
    const dsIdx = Number(await dep.certificateRegistry.getIdxOfDS(pubkey));

    console.log("Generating passport proof...");
    const proofGenStartTime = Date.now();
    const proof = await genPassportProof(passportData, currTime + 100, dsLeaves, dsIdx);
    console.log(`Proof generation took ${Math.floor((Date.now() - proofGenStartTime) / 1000)} seconds`);

    await dep.passportVerifier.verifyPassport(proof, 0);

    console.log("Passport verified!");
};

export { provePassport };