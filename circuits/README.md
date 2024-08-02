## Setup

Proof creation components and verification components need to be setup before
running the tests. The command below creates the proof generation wasm, proving 
key, and corresponding verifier contract for each circuit configured in 
`circuits.json` and places them in `./proofs` and `./contracts`.

NOTE: This requires downloading some large files for the first phase of the key
generation (possibly more than 1 GB) - the proving keys and wasm files generated
will take up further space (approx 0.5 GB). If the provided verifier contracts are used,
the key and wasm files uploaded using git lfs must be downloaded.

```sh
npm install
yarn start
```

## Testing

```sh
# test all circuits
yarn test

# test specific circuit
yarn test -g <circuit-name>

# integration tests with onchain components
npx hardhat test <testfile-path>
```

### Proof generation and onchain interactions

Passport data fields are base64 encoded DER encodings of the relevant information
extracted from the passport chip. 

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
npx hardhat genPassport --cert <signerCertPath> --key <signerCertPrivkeyPath> --out <outputPath> <options>

# generate a proof for existing passport
npx hardhat provePassport --passport <passportDataPath> --time <proofTimestamp> --out <outputPath>

# verify a passport
npx hardhat verifyPassport --proof <passportProofPath> --time-buffer <validTimeBuffer>

# generate a certificate
npx hardhat genCert --type <csca|ds> --issuer <issuerCertPath> --key <issuerCertPrivkeyPath> --out <outputPath>

# add a certificate to the registry
# this includes proof generation
npx hardhat addCert --type <csca|ds> --subject <path to certificate to add> --issuer <path to csca certificate that signed subject>

# export the state of the onchain certificate registry
npx hardhat exportState --out <outputPath>
```