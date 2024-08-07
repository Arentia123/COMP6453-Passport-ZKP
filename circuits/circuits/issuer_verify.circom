pragma circom 2.1.2;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "./binary_merkle_root.circom";

// wrapper around BinaryMerkleRoot that also checks the assumption
template IssuerVerify(max_depth, n, k) {
    signal input pubkey[k];
    signal input expected_root;
    signal input depth;
    signal input indices[max_depth];
    signal input siblings[max_depth];

    // check assumption for BinaryMerkleRoot (depth <= max_depth)
    var max_depth_bits = 0;
    var max_depth_temp = max_depth;
    while (max_depth_temp > 0) {
        max_depth_temp >>= 1;
        max_depth_bits++;
    }
    signal depth_lte_max_depth <== LessEqThan(max_depth_bits)([depth, max_depth]);
    depth_lte_max_depth === 1;

    // pack pubkey into 9 field elements since Poseidon circuit only supports
    // max 16 elements
    signal pubkey_packed[(k + 1) \ 2] <== PackChunks(n, k)(pubkey);
    signal leaf <== Poseidon((k + 1) \ 2)(pubkey_packed);
    signal root <== BinaryMerkleRoot(max_depth)(leaf, depth, indices, siblings);
    root === expected_root;
}