import { WitnessTester } from "circomkit";
import { circomkit } from "./common";

describe("TimestampToDate", async () => {
    let circuit: WitnessTester;
    before(async () => {
        circuit = await circomkit.WitnessTester("TimestampToDate", {
            file: "utils/timestamp_to_date",
            template: "TimestampToDate",
        });
    });

    it("should correctly convert timestamp to date", async () => {
        await circuit.expectPass(
            { in: Math.floor(new Date("2032-07-13").getTime() / 1000) },
            { year: 2032, month: 7, day: 13 }, 
        );
        console.log(await circuit.getConstraintCount());
    });

    it("should correctly convert timestamp to date", async () => {
        const now = Date.now();
        const nowDate = new Date(now);
        await circuit.expectPass(
            { in: Math.floor(now / 1000) },
            { year: nowDate.getUTCFullYear(), month: nowDate.getUTCMonth() + 1, day: nowDate.getUTCDate() },
        )
    });
});