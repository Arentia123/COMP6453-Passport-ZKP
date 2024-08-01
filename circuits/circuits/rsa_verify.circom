pragma circom 2.1.2;

include "./constants.circom";
include "@zk-email/circuits/lib/rsa.circom";

template RSAVerify(n, k) {
    signal input digest[256];
    signal input pubkey[k];
    signal input sig[k];

    // chunk econtent_hash for input to rsa verifier
    // modified from https://github.com/zkemail/zk-email-verify/blob/main/packages/circuits/email-verifier.circom
    var rsa_msg_size = (256 + n) \ n;
    component rsa_msg[rsa_msg_size];
    for (var i = 0; i < rsa_msg_size; i++) {
        rsa_msg[i] = Bits2Num(n);
    }
    for (var i = 0; i < 256; i++) {
        rsa_msg[i \ n].in[i % n] <== digest[255 - i];
    }
    for (var i = 256; i < n * rsa_msg_size; i++) {
        rsa_msg[i \ n].in[i % n] <== 0;
    }

    // verify the signature
    component rsa_verifier = RSAVerifier65537(n, k);
    for (var i = 0; i < rsa_msg_size; i++) {
        rsa_verifier.message[i] <== rsa_msg[i].out;
    }
    for (var i = rsa_msg_size; i < k; i++) {
        rsa_verifier.message[i] <== 0;
    }
    rsa_verifier.modulus <== pubkey;
    rsa_verifier.signature <== sig;
}