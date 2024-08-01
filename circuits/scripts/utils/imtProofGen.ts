import { LeanIMT } from "@zk-kit/lean-imt";
import { poseidon2 } from "poseidon-lite";

// LeanIMT generateProof but with the path/indices included
// Source: https://github.com/privacy-scaling-explorations/zk-kit.circom/blob/main/packages/binary-merkle-root/tests/common.ts
// (slightly modified)

export type BinaryMerkleTreeProof = {
    leaf: bigint
    depth: number
    indices: number[]
    siblings: bigint[]
    root: bigint
}

export const generateBinaryMerkleRoot = (maxDepth: number, nodes: string[], leafIndex: number): BinaryMerkleTreeProof => {
    const tree = new LeanIMT((a, b) => poseidon2([a, b]))

    nodes.forEach(node => tree.insert(BigInt(node)));

    const leaf = tree.leaves[leafIndex]

    const { siblings, index } = tree.generateProof(leafIndex)

    const depth = siblings.length

    // The index must be converted to a list of indices, 1 for each tree level.
    // The circuit tree depth is 20, so the number of siblings must be 20, even if
    // the tree depth is actually 3. The missing siblings can be set to 0, as they
    // won't be used to calculate the root in the circuit.
    const indices: number[] = []

    for (let i = 0; i < maxDepth; i += 1) {
        indices.push((index >> i) & 1)

        if (siblings[i] === undefined) {
            siblings[i] = BigInt(0)
        }
    }

    return {
        leaf,
        depth,
        indices,
        siblings,
        root: tree.root
    }
}