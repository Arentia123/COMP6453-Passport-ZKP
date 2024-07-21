pragma circom 2.1.2;

function get_dg1_size() {
    return 93;
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

