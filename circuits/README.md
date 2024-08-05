## Requirements

If starting from scratch (with circuit compilation, proof generation
wasm creation, proving key generation, and verification contract generation
ie. you're not downloading the wasms and proving keys), `circom 2.0` needs to 
be installed.

## Setup

```sh
npm install
npx hardhat compile
```

If you want to avoid downloading some very large files (for groth16 setup 
phase 1 Powers of Tau) and use the existing verifier contracts, you can download 
the proof generation wasms and proving keys from google drive 
[here](https://drive.google.com/drive/folders/1AJoyD2uBk3rSHQ8KKiaeFxfMmfuD8acB?usp=sharing)
(note that these are still fairly large, around 600 MB). 
After moving the proofs folder into this directory, you can skip the rest of setup.

### sha1 checksums
`PassportVerification.wasm - 7da13b2b10336fc95ef29e44215b8b10ad4cf07f`
`PassportVerification.zkey - 20c48c02b2e9240b737fb0bb4f5b471d61715404`
`CertVerification.wasm - a4263d60e9cbf5b6920224bac571e1db0d2e8138`
`CertVerification.zkey - 7ea80c9e00a54e3fff6b902f3986b553f05756c0`

Otherwise, proof generation components and verification components need to be setup before
running anything. The command below creates the proof generation wasm, proving 
key, and corresponding verifier contract for each circuit configured in 
`circuits.json` and places them in `./proofs` and `./contracts`.

WARNING: This requires downloading some large files for the first phase of the key
generation (approx 1.5 GB) - the proving keys and wasm files generated
will take up further space (approx 0.6 GB). If the provided verifier contracts are used,
the key and wasm files uploaded using git lfs must be downloaded.

```sh
yarn start
npx hardhat compile
```

## Testing

```sh
# test all circuits
yarn test

# test specific circuit
yarn test -g <circuit-name>

# integration tests with onchain components
npx hardhat node
npx hardhat test <testfile-path>
```

### Proof generation and onchain interactions

The expected directory structure is as follows:

- CSCA certificates in `./scripts/certs/csca/`
- DS certificates in `./scripts/certs/ds/`
- CSCA private keys in `./scripts/keys/csca/`
- DS private keys in `./scripts/keys/ds/`
- Proof generation wasm and proving key in `./proofs/<circuit-name>`

All certificates and keys used should be in PEM format.

Passport data fields are base64 encoded DER encodings of the relevant information
extracted from the passport chip. 

Note that time is relative to the timestamp of the local testnet, which does
not have to necessarily correspond with actual unix time.

WARNING: Do not create new files in `./scripts` with names (the part excluding the period + extension)
that overlap with the files in `./scripts`. This could cause issues where hardhat
tasks read the new file instead and error with `taskDefinition.action is not a function`.

```sh
# look at options for tasks
npx hardhat help <taskName>

# start a local test network (in a different terminal)
npx hardhat node

# deploy contracts
npx hardhat deploy

# generate random passport data (in the required format for proving)
# any letters in option arguments should be uppercase
# options are optional, and default information will be provided for anything not specified
npx hardhat genPassport --cert <signer-cert-path> --key <signer-cert-privkey-path> --out <output-path> <options>

# generate a proof for existing passport
npx hardhat provePassport --passport <passport-data-path> --time <proof-timestamp> --out <output-path>

# verify a passport
npx hardhat verifyPassport --proof <passport-proof-path> --time-buffer <valid-time-buffer>

# generate a certificate
npx hardhat genCert --type <csca|ds> --issuer <issuer-cert-path> --key <issuer-cert-privkey-path> --out-cert <cert-output-path> --out-key <privkey-output-path>

# add a certificate to the registry
# this includes proof generation
npx hardhat addCert --type <csca|ds> --subject <cert-to-add-path> --issuer <signer-cert-path>

# export the state of the onchain certificate registry
npx hardhat exportState --out <output-path>
```
### Example usage 

```sh
# start the local testnet (in a separate terminal)
npx hardhat node
# deploy the contracts (includes adding all csca certs in ./scripts/certs/csca and one ds certificate to registry)
npx hardhat deploy
# create a new ds certificate
npx hardhat genCert --type ds --issuer ./scripts/certs/csca/csca.pem --key ./scripts/keys/csca/cscaKey.pem --out-cert ./scripts/certs/ds/ds1.pem --out-key ./scripts/keys/ds/ds1Key.pem
# add the new ds certificate
npx hardhat addCert --type ds --subject ./scripts/certs/ds/ds1.pem --issuer ./scripts/certs/csca/csca.pem
# create new passport data signed by the new ds certificate
npx hardhat genPassport --cert ./scripts/certs/ds/ds1.pem --key ./scripts/keys/ds/ds1Key.pem --out ./passports/passport.json
# generate a proof for the new passport
npx hardhat provePassport --passport ./passports/passport.json --time $(echo "$(($(date +%s) + 172800))") --out ./passports/proof.json
# verify the passport (using the generated proof)
npx hardhat verifyPassport --proof ./passports/proof.json --time-buffer 0
```

### Some known limitations

- Passport proofs can be reused once submitted on-chain, a mechanism for preventing this
has not been integrated yet
- Conversion of the expiry date in the MRZ assumes that all dates with year >= 70
refer to the 1900s, which seems reasonable as e-passports were only introduced
in the early 2000s
- Conversion of the date of birth in the MRZ assumes that all dates with year >= 35
refer to the 1900s - this is a pretty big limitation which would require regular 
adjustment of the circuit and consequently the verifier contract


