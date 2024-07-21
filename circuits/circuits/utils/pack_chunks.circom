pragma circom 2.1.2;

// packs an array of k n-bit chunks into (k + 1) / 2 chunks
// where each chunk is two n-bit elements packed together as two 121-bit elements
// each individual element can't exceed 121 bits (field modulus is 254 bits) 
// we assume each in element <= n bits
template PackChunks(n, k) {
    assert(n <= 121);
    var num_packs = (k + 1) \ 2;

    signal input in[k];
    signal output out[num_packs];

    for (var i = 0; i < k \ 2; i++) {
        out[i] <== in[2 * i] + in[2 * i + 1] * (1 << 121);
    }

    // NOTE: there might be some issue here (malleability?), should probably investigate
    if (k & 1 == 1) {
        out[num_packs - 1] <== in[k - 1];
    }
}