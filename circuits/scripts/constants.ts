const KEY_DIR = "./scripts/keys";
const CERT_DIR = "./scripts/certs";
const DEFAULT_DS_CERT = "ds.pem";
const DEFAULT_DS_KEY = "dsKey.pem";
const DEFAULT_CA_CERT = "csca.pem";
const DEFAULT_CA_KEY = "cscaKey.key";

const CONTRACT_ADDR_JSON = "./scripts/deploymentAddresses.json";

const K = 17n;
const N = 121n;
const MAX_PREECONTENT_SIZE = 256;
const MAX_ECONTENT_SIZE = 192;
const MAX_TBS_CERT_SIZE = 1024;
const MAX_DEPTH = 16;

export { 
    KEY_DIR, CERT_DIR, K, N, MAX_PREECONTENT_SIZE, MAX_ECONTENT_SIZE, 
    MAX_TBS_CERT_SIZE, MAX_DEPTH, DEFAULT_DS_CERT, DEFAULT_DS_KEY,
    DEFAULT_CA_CERT, DEFAULT_CA_KEY, CONTRACT_ADDR_JSON
};