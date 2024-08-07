import { WitnessTester } from "circomkit";
import { circomkit } from "./common";
import { MAX_DEPTH, mockCertData, expectedLeaf } from "./common/certData";

const PARAMS = [1024];

describe("CertVerification", () => {
    let circuit: WitnessTester;
    before(async () => {
        circuit = await circomkit.WitnessTester("CertVerification", {
            file: "cert_verification",
            template: "CertVerification",
            params: PARAMS,
        });
    });

    it("should pass mock verification and output correct leaf", async () => {
        await circuit.expectPass(mockCertData, { cert_pubkey_hash: expectedLeaf });
    });

    it("should fail if the offset isn't right", async () => {
        let mockDataCopy = copyMockData();
        mockDataCopy.cert_pubkey_offset = (parseInt(mockDataCopy.cert_pubkey_offset) + 1).toString();
        await circuit.expectFail(mockDataCopy);
    });

    it("should fail if signature is invalid", async () => {
        let mockDataCopy = copyMockData();
        const sig_0 = BigInt(mockDataCopy.sig[0]);
        mockDataCopy.sig[0] = sig_0 > 0 ? (sig_0 - BigInt(1)).toString() : (sig_0 + BigInt(1)).toString();
        await circuit.expectFail(mockDataCopy);
    });

    it("should fail if the pubkey proof of membership is invalid", async () => {
        let mockDataCopy = copyMockData();
        mockDataCopy.expected_root = (BigInt(mockDataCopy.expected_root) + 1n).toString();
        await circuit.expectFail(mockDataCopy);

        mockDataCopy = copyMockData();
        mockDataCopy.depth = (parseInt(mockDataCopy.depth) + 1).toString();
        await circuit.expectFail(mockDataCopy);

        // check specific case mentioned in binary_merkle_root where depth > MAX_DEPTH
        mockDataCopy.depth = (MAX_DEPTH + 1).toString();
        mockDataCopy.expected_root = "0";
        await circuit.expectFail(mockDataCopy);

        mockDataCopy = copyMockData();
        mockDataCopy.siblings[0] = (BigInt(mockDataCopy.siblings[0]) + 1n).toString();
        await circuit.expectFail(mockDataCopy);

        mockDataCopy = copyMockData();
        mockDataCopy.indices[0] = (parseInt(mockDataCopy.indices[0]) + 1).toString();
        await circuit.expectFail(mockDataCopy);
    });

    const copyMockData = () => JSON.parse(JSON.stringify(mockCertData));
});