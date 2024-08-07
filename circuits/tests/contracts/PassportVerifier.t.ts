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

const PROOFS_DIR = "./proofs/PassportVerification";

describe("PassportVerifier", () => {
    let proofInput: PassportVerifier.PassportProofStruct;
    
    const getProofInput = () => JSON.parse(JSON.stringify(proofInput));

    before(async () => {
        mockPassportData.current_timestamp = (await time.latest()) + 172800;
        const { proof, publicSignals } = await groth16.fullProve(
            mockPassportData, 
            `${PROOFS_DIR}/PassportVerification.wasm`, 
            `${PROOFS_DIR}/PassportVerification.zkey`
        );
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
        const PassportPropProofVerifier = await hre.ethers.getContractFactory("PassportPropVerificationVerifier");

        const registryRoot = BigInt(mockPassportData.expected_root.toString());
        const registry = await MockRegistry.deploy(registryRoot);
        const verifier = await PassportProofVerifier.deploy();
        const propVerifier = await PassportPropProofVerifier.deploy();
        const passportVerifier = await PassportVerifier.deploy(
            await verifier.getAddress(), 
            await registry.getAddress(),
            await propVerifier.getAddress()
        );

        return { passportVerifier, verifier, registry, propVerifier };
    }

    it("should set the right verifier and registry", async () => {
        const { passportVerifier, verifier, registry, propVerifier } = await loadFixture(deployPassportVerifierFixture);

        expect(await passportVerifier.VERIFIER()).to.equal(await verifier.getAddress());
        expect(await passportVerifier.REGISTRY()).to.equal(await registry.getAddress());
        expect(await passportVerifier.PROP_VERIFIER()).to.equal(await propVerifier.getAddress());
        // to ensure registry root is correct for mock
        expect(await registry.getDSRoot()).to.equal(mockPassportData.expected_root);
    });

    it("should verify with correct proof", async () => {
        const { passportVerifier } = await loadFixture(deployPassportVerifierFixture);
        expect(await passportVerifier.verifyPassport(proofInput, "0x0")).to.be.true;
    });

    // two tests below relating to the early error conditions will not take 
    // as long due to not having to verify the proof (that's how we know it isn't
    // the proof failing due to wrong inputs)
    it("should fail if the expected_root does not match dsRegistry", async () => {
        const { passportVerifier } = await loadFixture(deployPassportVerifierFixture);
        const input = getProofInput();
        input.expectedRoot = BigInt(mockPassportData.expected_root.toString()) + 1n;
        expect(await passportVerifier.verifyPassport(input, "0x0")).to.be.false;
    });

    it("should fail if the proven timestamp is before the buffered time threshold", async () => {
        const { passportVerifier } = await loadFixture(deployPassportVerifierFixture);
        const currTime = BigInt(mockPassportData.current_timestamp.toString());
        await time.increaseTo(currTime);
        expect(await passportVerifier.verifyPassport(proofInput, "0x1")).to.be.false;
    });

    it("should succeed if the timestamp proven for is exactly the block time", async () => {
        const { passportVerifier } = await loadFixture(deployPassportVerifierFixture);
        const currTime = BigInt(mockPassportData.current_timestamp.toString());
        await time.increaseTo(currTime);
        expect(await passportVerifier.verifyPassport(proofInput, "0x0")).to.be.true;
    });
});