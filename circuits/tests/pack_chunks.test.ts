import { circomkit } from "./common";
import { WitnessTester } from "circomkit";

describe("pack_chunks", async () => {
    let circuit: WitnessTester;
    before(async () => {
        circuit = await circomkit.WitnessTester("pack_chunks", {
            file: "pack_chunks",
            template: "PackChunks",
        });
    });

    it("should correctly pack chunks", async () => {
        const input = new Array(17);
        for (let i = 0; i < 17; i++)
            input[i] = (i + 1).toString();

        const out = await circuit.calculateWitness({ in: input });

    });
});