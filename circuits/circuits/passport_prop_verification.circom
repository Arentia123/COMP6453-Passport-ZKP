pragma circom 2.1.2;

include "@zk-email/circuits/lib/sha.circom";
include "@zk-email/circuits/utils/array.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mux1.circom";
include "./issuer_verify.circom";
include "./rsa_verify.circom";
include "./utils/date_to_timestamp.circom";
include "./utils/sha256.circom";
include "./utils/pack_chunks.circom";
include "./utils/timestamp_to_date.circom";
include "constants.circom";
include "./property_verification.circom";

template PassportPropVerification(max_preecontent_size, max_econtent_size) {
    var dg1_size = get_dg1_size();
    var hash_size = get_sha256_hash_size();
    var dob_offset = get_dob_offset();
    var expiry_date_offset = get_expiry_date_offset();
    var nationality_offset = get_nationality_offset();
    var n = get_n();
    var k = get_k();
    var max_depth = get_max_depth();

    signal input dg1[dg1_size];
    // preecontent and econtent are sha256 padded
    signal input preecontent[max_preecontent_size];
    signal input econtent[max_econtent_size];

    // these are in format of k chunks of n bit field elements
    signal input pubkey[k];
    signal input sig[k];

    // proof of membership data - note that the leaves are the Poseidon hash of the 
    // pubkey (modulus) in format of k chunks of n bits of field elements
    signal input expected_root;
    signal input depth;
    signal input indices[max_depth];
    signal input siblings[max_depth];

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

    signal input required_age;
    signal input allowed_nationality[3];

    // check passport is not expired
    // @todo is it necessary to check the assumptions for SelectSubArray? if so
    // probably implement a strict version that checks them and replace all below
    signal expiry_date[6] <== SelectSubArray(dg1_size, 6)(dg1, expiry_date_offset, 6);
    signal expiry_timestamp <== DateToTimestamp()(expiry_date);
    signal expiry_timestamp_gt_current <== GreaterThan(64)([expiry_timestamp, current_timestamp]);
    expiry_timestamp_gt_current === 1;

    // check properties (first convert to date components)
    signal dob_int[6] <== SelectSubArray(dg1_size, 6)(dg1, dob_offset, 6);
    signal dob[6];
    for (var i = 0; i < 6; i++) {
        dob[i] <== dob_int[i] - 48;
    }
    // we assume that if year < 35, it is 2000s, otherwise 1900s
    // obviously this would become inaccurate very quickly (and is still inaccurate
    // for some people alive), but not exactly sure how to handle this dynamically 
    signal dob_year_int <== dob[0] * 10 + dob[1];
    signal year_lt_35 <== LessThan(16)([dob_year_int, 35]);
    signal dob_year <== Mux1()([1900 + dob_year_int, 2000 + dob_year_int], year_lt_35);
    signal dob_month <== dob[2] * 10 + dob[3];
    signal dob_day <== dob[4] * 10 + dob[5];
    component currDate = TimestampToDate();
    currDate.in <== current_timestamp;
    signal nationality[3] <== SelectSubArray(dg1_size, 3)(dg1, nationality_offset, 3);
    PropertyVerification()(
        dob_year, dob_month, dob_day, currDate.year, currDate.month, currDate.day,
        nationality, required_age, allowed_nationality
    );

    IssuerVerify(max_depth, n, k)(pubkey, expected_root, depth, indices, siblings);

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

    // verify the signature
    RSAVerify(n, k)(econtent_hash, pubkey, sig);
}
