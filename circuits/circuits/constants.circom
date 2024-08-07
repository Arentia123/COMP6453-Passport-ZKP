pragma circom 2.1.2;

function get_dg1_size() {
    return 93;
}

function get_nationality_offset() {
    return 59;
}

function get_dob_offset() {
    return 62;
}

function get_expiry_date_offset() {
    return 70;
}

function get_sha256_hash_size() {
    return 32;
}

// taken by default from zk-email
function get_n() {
    return 121;
}

// taken by default from zk-email
function get_k() {
    return 17;
}

// arbitrary merkle tree depth, could potentially change
function get_max_depth() {
    return 16;
}

function get_pubkey_size() {
    return 256;
}

function get_sha256rsa_fixed() {
    return [
        0x30, 0x82, 0x01, 0x22, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 
        0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00, 0x03, 0x82, 0x01, 
        0x0f, 0x00, 0x30, 0x82, 0x01, 0x0a, 0x02, 0x82, 0x01, 0x01, 0x00
    ];
}

