pragma circom 2.0.5;

include "circomlib/circuits/sha256/sha256.circom";
include "@zk-email/circuits/lib/sha.circom";

// zk-email dynamic sha256 hash but with bytes output
template Sha256BytesDynamicOutBytes(maxByteLength) {
    signal input paddedIn[maxByteLength];
    signal input paddedInLength;
    signal output out[32];

    var maxBits = maxByteLength * 8;
    component sha = Sha256General(maxBits);

    component bytes[maxByteLength];
    for (var i = 0; i < maxByteLength; i++) {
        bytes[i] = Num2Bits(8);
        bytes[i].in <== paddedIn[i];
        for (var j = 0; j < 8; j++) {
            sha.paddedIn[i*8+j] <== bytes[i].out[7-j];
        }
    }
    sha.paddedInLength <== paddedInLength * 8;

    component bitsToBytes[32];
    for (var i = 0; i < 32; i++) {
        bitsToBytes[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            bitsToBytes[i].in[7-j] <== sha.out[i*8+j];
        }
        out[i] <== bitsToBytes[i].out;
    }
}

/*
 * Helper function for computing sha256 commitments that take as input and 
 * output bytes instead of bits.
 * 
 * Source: https://github.com/succinctlabs/telepathy-circuits/blob/main/circuits/sha256.circom
 */

template Sha256BytesOutBytes(n) {
    signal input in[n];
    signal output out[32];

    component byteToBits[n];
    for (var i = 0; i < n; i++) {
        byteToBits[i] = Num2Bits(8);
        byteToBits[i].in <== in[i];
    }

    component sha256 = Sha256(n*8);
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < 8; j++) {
            sha256.in[i*8+j] <== byteToBits[i].out[7-j];
        }
    }

    component bitsToBytes[32];
    for (var i = 0; i < 32; i++) {
        bitsToBytes[i] = Bits2Num(8);
        for (var j = 0; j < 8; j++) {
            bitsToBytes[i].in[7-j] <== sha256.out[i*8+j];
        }
        out[i] <== bitsToBytes[i].out;
    }
}