import fs from "fs/promises";
import { CONTRACT_ADDR_JSON } from "./constants";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const getDeployment = async (hre: HardhatRuntimeEnvironment) => {
    const contractAddrs = JSON.parse(await fs.readFile(CONTRACT_ADDR_JSON, "utf-8"));

    const CertificateRegistry = await hre.ethers.getContractFactory(
        "CertificateRegistry",
        { libraries: { LeanIMT: contractAddrs.LeanIMT } }
    );
    const PassportVerifier = await hre.ethers.getContractFactory("PassportVerifier");

    return {
        certificateRegistry: CertificateRegistry.attach(contractAddrs.CertificateRegistry),
        passportVerifier: PassportVerifier.attach(contractAddrs.PassportVerifier),
    }
};

export { getDeployment };