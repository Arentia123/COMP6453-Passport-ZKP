pragma circom 2.1.2;

include "circomlib/circuits/comparators.circom";

template Div() {
    signal input in[2];
    signal output out;

    out <-- in[0] \ in[1];
    signal rem <-- in[0] % in[1];
    // rem must be < in[1], otherwise we could have multiple solutions
    // there should be an implicit check in LessThan that the inputs are <= 252 bits
    signal rem_lt_in1 <== LessThan(252)([rem, in[1]]);
    rem_lt_in1 === 1;
    signal out_eq <== IsEqual()([out * in[1] + rem, in[0]]);
    out_eq === 1;
}