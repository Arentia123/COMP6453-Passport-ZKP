import { WitnessTester } from "circomkit";
import { circomkit } from "./common";

describe("PropertyVerification", async () => {
    let circuit: WitnessTester;
    const defaultInput = () => {
        return {
            dobYear: 2000, dobMonth: 1, dobDay: 1, currentYear: 2024, 
            currentMonth: 1, currentDay: 1, nationality: [1, 1, 1], 
            requiredAge: 24, allowedNationality: [1, 1, 1]
        };
    };

    before(async () => {
        circuit = await circomkit.WitnessTester("PropertyVerification", {
            file: "property_verification",
            template: "PropertyVerification",
        });
    });

    it("should pass if age and nationality are valid", async () => {
        await circuit.expectPass(defaultInput());
    });

    it("should fail if not old enough", async () => {
        const input = defaultInput();
        input.dobDay = 2;
        await circuit.expectFail(input);

        input.dobDay = 1;
        input.currentDay = 31;
        input.currentMonth = 12;
        input.currentYear = 2023;
        await circuit.expectFail(input);
    });

    it("should not underflow and allow 0 year old to pass", async () => {
        const input = defaultInput();
        input.dobDay = 2;
        input.currentYear = 2000;
        await circuit.expectFail(input);
    });

    it("should fail if nationality doesn't match", async () => {
        const input = defaultInput();
        input.nationality[0] = 0;
        await circuit.expectFail(input);
    });
});