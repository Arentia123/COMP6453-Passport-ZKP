import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import { deploy } from "./scripts/deploy";
import { provePassport } from "./scripts/provePassport";
import { addCert } from "./scripts/addCert";

task("deploy", "Deploy the contracts").setAction(deploy);
task("provePassport", "Prove a passport")
    .addOptionalParam("passportJson", "Path to a JSON file containing passport data")
    .setAction(provePassport);
task("addCert", "Add a certificate to the registry")
    .addParam("type", "Type of certificate (csca or ds)")
    .addParam("subject", "Path to the certificate being added")
    .addParam("issuer", "Path to the certificate that issued subject")
    .setAction(addCert);

const config: HardhatUserConfig = {
  solidity: "0.8.24",
};

export default config;
