import { CircuitSignals, WitnessTester } from "circomkit";
import { circomkit } from "./common";
import { INPUT_SIGNALS, MAX_DEPTH, mockPassportData } from "./common/passportData";
import assert from "node:assert";

const PARAMS = [256, 192];
const EXPIRY_DATE_OFFSET = 70;

describe("passport_verification", () => {
    let circuit: WitnessTester;
    let mockData: CircuitSignals<INPUT_SIGNALS>;
    before(async () => {
        circuit = await circomkit.WitnessTester("passport_verification", {
            file: "passport_verification",
            template: "PassportVerification",
            params: PARAMS,
        });

        mockData = JSON.parse(JSON.stringify(mockPassportData));
        mockData.current_timestamp = `${Math.floor((new Date).getTime() / 1000) + 3600 * 12}`;
    });

    it("dateBytesToTimestamp should correctly convert date to timestamp", async () => {
        const timestamp = dateBytesToTimestamp(["51", "50", "48", "55", "49", "51"]);
        assert(timestamp === Math.floor(new Date("2032-07-13").getTime() / 1000));
    });

    it("should pass mock verification", async () => {
        await circuit.expectPass(mockData);
    });

    it("should fail if expired", async () => {
        let mockDataCopy = copyMockData();
        const expiryData = (mockDataCopy.dg1 as Array<string>).slice(EXPIRY_DATE_OFFSET, EXPIRY_DATE_OFFSET + 6);
        mockDataCopy.current_timestamp = `${dateBytesToTimestamp(expiryData) + 1}`;
        await circuit.expectFail(mockDataCopy);
    });

    it("should fail if dg1 hash doesn't match preecontent", async () => {
        let mockDataCopy = copyMockData();
        mockDataCopy.dg1[0] = mockDataCopy.dg1[0] === "0" ? "1" : "0";
        await circuit.expectFail(mockDataCopy);
    });

    it("should fail if preecontent hash doesn't match econtent", async () => {
        let mockDataCopy = copyMockData();
        mockDataCopy.preecontent[0] = mockDataCopy.preecontent[0] === "0" ? "1" : "0";
        await circuit.expectFail(mockDataCopy);
    });

    it("should fail if econtent hash doesn't match digest recovered from signature", async () => {
        let mockDataCopy = copyMockData();
        mockDataCopy.econtent[0] = mockDataCopy.econtent[0] === "0" ? "1" : "0";
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

    const dateBytesToTimestamp = (bytes: Array<string>) => {
        const date = bytes.map((byte) => parseInt(String.fromCharCode(parseInt(byte))));
        let year = date[0] * 10 + date[1];
        year = year < 70 ? year + 2000 : year + 1900;
        const month = date[2] * 10 + date[3];
        const day = date[4] * 10 + date[5];
        return Math.floor((Date.UTC(year, month - 1, day)) / 1000);
    }

    const copyMockData = () => JSON.parse(JSON.stringify(mockPassportData));
});
