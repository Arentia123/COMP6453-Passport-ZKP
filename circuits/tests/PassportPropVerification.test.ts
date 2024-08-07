import { CircuitSignals, WitnessTester } from "circomkit";
import { circomkit } from "./common";
import { mockPassportData } from "./common/passportData";

const PARAMS = [256, 192];
const EXPIRY_DATE_OFFSET = 70;

type INPUT_SIGNALS = [
    "dg1", "preecontent", "econtent", "pubkey", "sig", "dg1_offset",
    "preecontent_size", "preecontent_offset", "econtent_size", "current_timestamp",
	"expected_root", "depth", "indices", "siblings", "required_age", "allowed_nationality"
];

describe("PassportPropVerification", () => {
    let circuit: WitnessTester;
    let mockData: CircuitSignals<INPUT_SIGNALS>;
    before(async () => {
        circuit = await circomkit.WitnessTester("PassportPropVerification", {
            file: "passport_prop_verification",
            template: "PassportPropVerification",
            params: PARAMS,
        });

        mockData = JSON.parse(JSON.stringify(mockPassportData));
        mockData.current_timestamp = `${Math.floor((new Date).getTime() / 1000) + 3600 * 12}`;
        mockData.required_age = "18";
        mockData.allowed_nationality = ["65", "85", "83"];
    });

    it("should pass mock verification", async () => {
        await circuit.expectPass(mockData);
    });

    it("should fail if not old enough", async () => {
        const input = copyMockData();
        input.required_age = "25";
        await circuit.expectFail(input);
    });

    it("should fail if nationality doesn't match", async () => {
        const input = copyMockData();
        input.allowed_nationality[0] = "1";
        await circuit.expectFail(input);
    });

    const copyMockData = () => JSON.parse(JSON.stringify(mockData));
});