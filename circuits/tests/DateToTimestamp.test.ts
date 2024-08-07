import { WitnessTester } from "circomkit";
import { circomkit } from "./common";

describe("DateToTimestamp", async () => {
    let circuit: WitnessTester;
    before(async () => {
        circuit = await circomkit.WitnessTester("date_to_timestamp", {
            file: "utils/date_to_timestamp",
            template: "DateToTimestamp",
        });
    });

    it("should correctly convert date to timestamp", async () => {
        const input = { in: [51, 50, 48, 55, 49, 51] };
        await circuit.expectPass(
            { in: [51, 50, 48, 55, 49, 51] }, 
            { out: Math.floor(new Date("2032-07-13").getTime() / 1000) }
        );
    });
});
