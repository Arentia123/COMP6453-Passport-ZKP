pragma circom 2.1.2;

include "@zk-email/circuits/utils/array.circom";
include "circomlib/circuits/poseidon.circom";
include "./issuer_verify.circom";
include "./rsa_verify.circom";
include "./constants.circom";
include "./utils/sha256.circom";
include "./utils/pack_chunks.circom";

// ideally, this would take multiple certificates signed by the same csca certificate
// and prove them all at once proving significantly better than verifying onchain 
// (which would be very expensive gas wise)
template CertVerification(max_tbs_size) {
    var n = get_n();
    var k = get_k();
    var hash_size = get_sha256_hash_size();
    var max_depth = get_max_depth();

    // must be sha256 padded for dynamic hashing
    signal input tbs_cert[max_tbs_size];
    signal input tbs_cert_size;
    // the pubkey of the issuer
    signal input pubkey[k];
    signal input sig[k];

    signal input expected_root;
    signal input depth;
    signal input indices[max_depth];
    signal input siblings[max_depth];

    signal input cert_pubkey_offset;

    signal output cert_pubkey_hash;

    // @note - need to check expiry, but not sure how to do so; the valid timestamp
    // offsets are variable, so not sure how to prevent prover from providing 
    // arbitrary offsets (there's no long, fixed sequence binding the timestamps 
    // in the encoding unlike the pubkey)

    IssuerVerify(max_depth, n, k)(pubkey, expected_root, depth, indices, siblings);

    // verify the certificate was signed by the issuer corresponding to pubkey
    signal tbs_cert_hash[hash_size * 8] <== Sha256Bytes(max_tbs_size)(tbs_cert, tbs_cert_size);

    RSAVerify(n, k)(tbs_cert_hash, pubkey, sig);

    // note check that the part before the offset is the correct signature alg,
    // this also ensures we can't just give an arbitrary offset
    var fixed_sha256rsa[33] = get_sha256rsa_fixed();
    signal fixed_sha256rsa_bytes[33] <== SelectSubArray(max_tbs_size, 33)(tbs_cert, cert_pubkey_offset - 33, 33);
    for (var i = 0; i < 33; i++) {
        fixed_sha256rsa_bytes[i] === fixed_sha256rsa[i];
    }

    // extract the 2048 bit (256 bytes) public key
    var pubkey_size = get_pubkey_size();
    signal cert_pubkey[pubkey_size] <== SelectSubArray(max_tbs_size, pubkey_size)(tbs_cert, cert_pubkey_offset, pubkey_size);
    
    signal pubkey_bits[pubkey_size][8];
    for (var i = 0; i < pubkey_size; i++) {
        pubkey_bits[i] <== Num2Bits(8)(cert_pubkey[i]);
    }

    // chunk into k n bit field elements (representing pubkey in little endian)
    component pubkey_chunks[k];
    for (var i = 0; i < k; i++) {
        pubkey_chunks[i] = Bits2Num(n);
    }
    for (var i = 0; i < pubkey_size * 8; i++) {
        pubkey_chunks[i \ n].in[i % n] <== pubkey_bits[pubkey_size - 1 - i \ 8][i % 8];
    }
    for (var i = pubkey_size * 8; i < n * k; i++) {
        pubkey_chunks[i \ n].in[i % n] <== 0;
    }

    // pack the chunks 
    var packed_size = (k + 1) \ 2;
    component packed_pubkey = PackChunks(n, k);
    for (var i = 0; i < k; i++) {
        packed_pubkey.in[i] <== pubkey_chunks[i].out;
    }

    // hash to get the leaf
    cert_pubkey_hash <== Poseidon(packed_size)(packed_pubkey.out);
}