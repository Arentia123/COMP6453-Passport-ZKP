import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import { deploy } from "./scripts/deploy";
import { genPassport, provePassport, verifyPassport } from "./scripts/passport";
import { addCert, genCert } from "./scripts/cert";
import { exportState } from "./scripts/state";

task("deploy", "Deploy the contracts").setAction(deploy);
task("genPassport", "Generate random passport data")
    .addParam("cert", "Path to the signer certificate")
    .addParam("key", "Path to the signer key")
    .addParam("out", "Path to the output JSON file")
    .addOptionalParam("expiryDate", "Expiry date of the passport in YYMMDD format")
    .addOptionalParam("issuingState", "3 letter code of the issuing state")
    .addOptionalParam("firstName", "First name of the passport holder")
    .addOptionalParam("surname", "Surname of the passport holder")
    .addOptionalParam("docNumber", "Document number of the passport")
    .addOptionalParam("nationality", "3 letter code of nationality")
    .addOptionalParam("dob", "Date of birth of the passport holder in YYMMDD format")
    .addOptionalParam("sex", "Single letter indicating sex")
    .addOptionalParam("dg1Offset", "Offset of the DG1 hash in the preecontent")
    .addOptionalParam("preecontentSize", "Size of the preecontent")
    .addOptionalParam("preecontentOffset", "Offset of the preecontent hash in the econtent")
    .addOptionalParam("econtentSize", "Size of the econtent")
    .setAction(genPassport);
task("provePassport", "Generate a passport proof")
    .addParam("passport", "Path to a JSON file containing passport data")
    .addParam("time", "UTC unix timestamp in seconds to prove at")
    .addParam("out", "Path to the output JSON file")
    .addOptionalParam("requiredAge", "Minimum age of the passport holder")
    .addOptionalParam("allowedNationality", "3 letter code of required nationality")
    .setAction(provePassport);
task("verifyPassport", "Prove a passport")
    .addParam("proof", "Path to a JSON file containing passport data")
    .addParam("timeBuffer", "Buffer in seconds after which passport must be valid")
    .addOptionalParam("type", "Type of passport proof (normal or prop (with property checks))")
    .setAction(verifyPassport);
task("genCert", "Generate a certificate")
    .addParam("type", "Type of certificate (csca or ds)")
    .addParam("issuer", "Path to the issuer certificate")
    .addParam("key", "Path to the issuer private key")
    .addParam("outCert", "Path to the output certificate")
    .addParam("outKey", "Path to the output certificate private key")
    .setAction(genCert);
task("addCert", "Add a certificate to the registry")
    .addParam("type", "Type of certificate (csca or ds)")
    .addParam("subject", "Path to the certificate being added")
    .addParam("issuer", "Path to the certificate that issued subject")
    .setAction(addCert);
task("exportState", "Export the state of the certificate registry")
    .addParam("out", "Path to the output JSON file")
    .setAction(exportState);

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "localhost",
};

export default config;
