from cryptography.hazmat.primitives.asymmetric import utils, rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography import x509
from mrz.generator.td3 import TD3CodeGenerator
from hashlib import sha256
from random import randbytes
from datetime import datetime, timezone

import os
import json
import base64
import sys

# default parameters from zk-email rsa verifier
N = 121
K = 17
DEFAULT_DATA = {
    "country_code": "AUS",
    "surname": "Doe",
    "given_names": "John",
    "document_number": "RA1111111",
    "nationality": "AUS",
    "birth_date": "000101",
    "sex": "M",
    "expiry_date": "320101",
    "dg1_offset": 29,
    "preecontent_size": 233,
    "preecontent_offset": 42,
    "econtent_size": 74,
}
MAX_PREECONTENT_SIZE = 256
MAX_ECONTENT_SIZE = 192

def to_str_list(s):
    return list(map(lambda x: str(x), s))

# format num for zk-email rsa verifier - k chunks of n bit field elements little endian
def num_to_knbits(num):
    knbits = [0] * K
    # mask for the lower n bits
    mask = (1 << N) - 1
    for i in range(K):
        knbits[i] = num & mask
        num >>= N 

    return knbits

def sha256_pad(msg):
    l = len(msg) * 8
    bits = int.from_bytes(msg, "big")
    # message must have bit length < 2^64
    assert(l < (1 << 65))
    # append 1
    bits = (bits << 1) | 1
    # append k 0s where k is the smallest, non-negative solution to l + 1 + k = 448 (mod 512)
    k = (448 - l - 1) % 512 
    bits <<= k
    # append 64-bit representation of l
    bits <<= 64
    bits |= l & ((1 << 65) - 1)

    return bits.to_bytes((l + 1 + k + 64) // 8, "big")

def zeropad(data, padded_len):
    l = len(data)
    assert(padded_len >= l)
    return data + ['0'] * (padded_len - l)

def format_data(mrz: bytes, preecontent: bytes, econtent: bytes, sig: bytes, 
                pubkey: int, dg1_offset: int, preecontent_offset: int):
    preecontent = sha256_pad(preecontent)
    econtent = sha256_pad(econtent)
    return { 
        "dg1": to_str_list(mrz),
        # must have sha256 padding for dynamic hashing
        "preecontent": zeropad(to_str_list(preecontent), MAX_PREECONTENT_SIZE),
        # must have sha256 padding for dynamic hashing
        "econtent": zeropad(to_str_list(econtent), MAX_ECONTENT_SIZE),
        "sig": to_str_list(num_to_knbits(int(sig.hex(), 16))),
        "pubkey": to_str_list(num_to_knbits(pubkey)),
        "dg1_offset": str(dg1_offset),
        # padded preecontent len
        "preecontent_size": str(len(preecontent)),
        "preecontent_offset": str(preecontent_offset),
        # padded econtent len
        "econtent_size": str(len(econtent)),
        # this should be set when testing, the value has be validated onchain
        "current_timestamp": str(int(datetime.now(timezone.utc).timestamp())),
    };

# data must be output from format_data
def write_data_to_json(data, file): 
    with open(file, "w") as f:
        f.write('{\n')
        keys = list(data.keys())
        kn = len(keys)
        for i in range(kn - 1):
            f.write(f"\t\"{keys[i]}\": ")
            json.dump(data[keys[i]], f)
            f.write(",\n")
        f.write(f"\t\"{keys[-1]}\": ")
        json.dump(data[keys[-1]], f)
        f.write("\n}")

def gen_key(privfile, pubfile):
    priv_key = rsa.generate_private_key(65537, 2048)
    priv_pem = priv_key.private_bytes(
        encoding=serialization.Encoding.PEM, 
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    pub_pem = priv_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )

    with open(privfile, "wb") as f:
        f.write(priv_pem)

    with open(pubfile, "wb") as f:
        f.write(pub_pem)

def generate_test_data(country_code, surname, given_names, document_number,
                       nationality, birth_date, sex, expiry_date, dg1_offset,
                       preecontent_size, preecontent_offset, econtent_size,
                       privkey_file, output_file):
    mrz = TD3CodeGenerator(
        "P", country_code, surname, given_names, document_number, nationality, 
        birth_date, sex, expiry_date
    )

    mrz = bytes.fromhex("615b5f1f58") + (mrz._line1() + mrz._line2()).encode()
    
    # set dg1 hash in preecontent
    digest = sha256(mrz).digest() 
    preecontent = bytearray(randbytes(preecontent_size))
    preecontent[dg1_offset: dg1_offset + 32] = digest 

    # set preecontent hash in econtent
    digest = sha256(preecontent).digest()
    econtent = bytearray(randbytes(econtent_size))
    econtent[preecontent_offset: preecontent_offset + 32] = digest 

    # rsa pad econtent hash
    digest = sha256(econtent).digest()

    # sign econtent
    with open(privkey_file, "rb") as f:
        privkey = serialization.load_pem_private_key(f.read(), None)
    sig = privkey.sign(digest, padding.PKCS1v15(), utils.Prehashed(hashes.SHA256()))

    pubkey = privkey.public_key().public_numbers().n

    data = format_data(mrz, preecontent, econtent, sig, pubkey, dg1_offset, 
                       preecontent_offset)
    write_data_to_json(data, output_file)

# for converting json output from zk-creds passport scanner to circuit inputs
def b64json_to_inputs(json_file, output_file):
    with open(json_file) as f:
        d = json.load(f)

    for k in d:
        try:
            d[k] = base64.b64decode(d[k])
        except:
            pass

    ds = x509.load_der_x509_certificate(d["cert"]) 
    pubkey = ds.public_key().public_numbers().n

    dg1 = d["dg1"]
    preecontent = d["pre-econtent"]
    econtent = d["econtent"]

    # we assume it's there
    def find_hash_offset(a, b):
        a_hash = sha256(a).digest()
        for i in range(len(b)):
            if b[i: i + 32] == a_hash:
                return i
        exit("data is invalid, failed to find offset")

    dg1_offset = find_hash_offset(dg1, preecontent) 
    preecontent_offset = find_hash_offset(preecontent, econtent)

    data = format_data(dg1, preecontent, econtent, d["sig"], 
                       pubkey, dg1_offset, preecontent_offset)
    write_data_to_json(data, output_file)


if __name__ == "__main__":
    arglen = len(sys.argv)
    assert(arglen == 4 or arglen == 1)
    if arglen == 4:
        privfile = sys.argv[1]
        pubfile = sys.argv[2]
        output_file = sys.argv[3]
    else:
        privfile = "privkey.pem"
        pubfile = "pubkey.pem"
        output_file = "mock_passport_inputs.json"

    if not os.path.exists(privfile) or not os.path.exists(pubfile):
        gen_key(privfile, pubfile)
    generate_test_data(**DEFAULT_DATA, privkey_file=privfile, output_file=output_file)
