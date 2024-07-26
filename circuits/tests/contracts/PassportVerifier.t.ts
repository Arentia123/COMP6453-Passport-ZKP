import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

import { mockPassportData } from "../common/passportData";
import { PassportVerifier } from "../../typechain-types";

import { groth16 } from "snarkjs";

// @note wasm and proving key must be generated before running tests
// the proving key corresponding to the current verifier contract is not 
// committed due to file size, so a new proving key and contract must be generated locally
// and moved into the correct paths

const fixedProofDir = "fixed_proofs/passport_verification";

describe("PassportVerifier", () => {
    let proofInput: PassportVerifier.PassportProofStruct;
    
    before(async () => {
        const { proof, publicSignals } = await groth16.fullProve(mockPassportData, `${fixedProofDir}/passport_verification.wasm`, `${fixedProofDir}/passport_verification.zkey`);
        const calldataRaw = await groth16.exportSolidityCallData(proof, publicSignals);
        const calldata = JSON.parse(`[${calldataRaw}]`);

        proofInput = {
            a: calldata[0],
            b: calldata[1],
            c: calldata[2],
            expectedRoot: calldata[3][0],
            currentTimestamp: calldata[3][1],
        };
    });

    async function deployPassportVerifierFixture() {
        const MockRegistry = await hre.ethers.getContractFactory("MockRegistry");
        const PassportProofVerifier = await hre.ethers.getContractFactory("PassportVerificationVerifier");
        const PassportVerifier = await hre.ethers.getContractFactory("PassportVerifier");

        const registryRoot = BigInt(mockPassportData.expected_root.toString());
        const dsRegistry = await MockRegistry.deploy(registryRoot);
        const verifier = await PassportProofVerifier.deploy();
        const passportVerifier = await PassportVerifier.deploy(await verifier.getAddress(), await dsRegistry.getAddress());

        return { passportVerifier, verifier, dsRegistry };
    }

    it("should set the right verifier and registry", async () => {
        const { passportVerifier, verifier, dsRegistry } = await loadFixture(deployPassportVerifierFixture);

        expect(await passportVerifier.VERIFIER()).to.equal(await verifier.getAddress());
        expect(await passportVerifier.DS_REGISTRY()).to.equal(await dsRegistry.getAddress());
        // to ensure registry root is correct for mock
        expect(await dsRegistry.getRoot()).to.equal(mockPassportData.expected_root);
    });

    it("should verify with correct proof", async () => {
        const { passportVerifier } = await loadFixture(deployPassportVerifierFixture);
        expect(await passportVerifier.verifyPassport(proofInput, "0x0")).to.be.true;
    });

    it("should fail if the expected_root does not match dsRegistry", async () => {
        const { passportVerifier } = await loadFixture(deployPassportVerifierFixture);
        proofInput.expectedRoot = BigInt(mockPassportData.expected_root.toString()) + 1n;
        expect(await passportVerifier.verifyPassport(proofInput, "0x0")).to.be.false;
    });

    it("should fail if the proven timestamp is before the buffered time threshold", async () => {
        const { passportVerifier } = await loadFixture(deployPassportVerifierFixture);
        const currTime = BigInt(mockPassportData.current_timestamp.toString());
        await time.increaseTo(currTime);
        expect(await passportVerifier.verifyPassport(proofInput, "0x1")).to.be.false;
    });

    it.skip("should succeed if the timestamp proven for is exactly the block time", async () => {
        const { passportVerifier } = await loadFixture(deployPassportVerifierFixture);
        const currTime = BigInt(mockPassportData.current_timestamp.toString());
        await time.increaseTo(currTime);
        const res = await passportVerifier.verifyPassport(proofInput, "0x0");
        expect(res).to.be.true;
    });
});