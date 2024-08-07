import { circomkit } from "./common";
import { WitnessTester } from "circomkit";
import { expect } from "chai";
import { SignalValueType } from "circomkit/dist/types";

describe("PackChunks", async () => {
    let circuit: WitnessTester;
    before(async () => {
        circuit = await circomkit.WitnessTester("pack_chunks", {
            file: "utils/pack_chunks",
            template: "PackChunks",
            params: [121, 17]
        });
    });

    it("should correctly pack chunks", async () => {
        const input = new Array(17);
        for (let i = 0; i < 17; i++)
            input[i] = (i + 1).toString();

        const { out } = await circuit.compute({ in: input }, ["out"]);
        expect((out as SignalValueType[]).length).eq(9);
    });
});