pragma circom 2.1.2;

include "@zk-email/circuits/lib/rsa.circom";
include "@zk-email/circuits/lib/sha.circom";
include "@zk-email/circuits/utils/array.circom";
include "date_to_timestamp.circom";
include "constants.circom";
include "sha256.circom";

template PassportVerification(max_preecontent_size, max_econtent_size) {
    var dg1_size = get_dg1_size();
    var hash_size = get_sha256_hash_size();
    var expiry_date_offset = get_expiry_date_offset();
    var n = get_n();
    var k = get_k();

    signal input dg1[dg1_size];
    // preecontent and econtent are sha256 padded
    signal input preecontent[max_preecontent_size];
    signal input econtent[max_econtent_size];

    // these are in format of k chunks of n bit field elements
    signal input pubkey[k];
    signal input sig[k];

    // dg1_offset, preecontent_size, preecontent_offset, econtent_size are variable
    // across different passports, so we include them as inputs
    // preecontent_size and econtent_size are the sizes of preecontent and econtent
    // (including sha256 padding)
    signal input dg1_offset;
    signal input preecontent_size;
    signal input preecontent_offset;
    signal input econtent_size;

    // this must be input from a trusted source e.g. ethereum block.timestamp
    // there should be a buffer added (e.g. 6 months or so)
    signal input current_timestamp;

    // TODO: check passport is not expired 
    signal expiry_date[6] <== SelectSubArray(dg1_size, 6)(dg1, expiry_date_offset, 6);
    signal expiry_timestamp <== DateToTimestamp()(expiry_date);
    signal expiry_timestamp_gt_current <== GreaterThan(64)([expiry_timestamp, current_timestamp]);
    expiry_timestamp_gt_current === 1;

    // TODO: check for pubkey inclusion in the registry (e.g. via merkle proof)

    // verify dg1 hash matches the one in pre_econtent
    signal dg1_hash[hash_size] <== Sha256BytesOutBytes(dg1_size)(dg1);
    signal dg1_hash_extract[hash_size] <== SelectSubArray(max_preecontent_size, hash_size)(preecontent, dg1_offset, hash_size);
    for (var i = 0; i < hash_size; i++) {
        dg1_hash[i] === dg1_hash_extract[i];
    }

    // verify pre_econtent hash matches the one in econtent
    signal preecontent_hash[hash_size] <== Sha256BytesDynamicOutBytes(max_preecontent_size)(preecontent, preecontent_size);
    signal preecontent_hash_extract[hash_size] <== SelectSubArray(max_econtent_size, hash_size)(econtent, preecontent_offset, hash_size);
    for (var i = 0; i < hash_size; i++) {
        preecontent_hash[i] === preecontent_hash_extract[i];
    }

    signal econtent_hash[hash_size * 8] <== Sha256Bytes(max_econtent_size)(econtent, econtent_size);

    // chunk econtent_hash for input to rsa verifier
    // modified from https://github.com/zkemail/zk-email-verify/blob/main/packages/circuits/email-verifier.circom
    var rsa_msg_size = (256 + n) \ n;
    component rsa_msg[rsa_msg_size];
    for (var i = 0; i < rsa_msg_size; i++) {
        rsa_msg[i] = Bits2Num(n);
    }
    for (var i = 0; i < 256; i++) {
        rsa_msg[i \ n].in[i % n] <== econtent_hash[255 - i];
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