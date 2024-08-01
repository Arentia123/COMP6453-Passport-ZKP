## Setup

Proof creation components and verification components need to be setup before
running the tests. The command below creates the proof generation wasm, proving 
key, and corresponding verifier contract for each circuit configured in 
`circuits.json` and places them in `./contracts` and `./proofs`. 

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

### Generating PKI components

In the `scripts` directory, `genpki.sh` can be used to generate keys and 
certificates for the passport PKI. These will be the deploy script to create the
onchain merkle trees.

### Onchain interactions

```sh
# start a local test network (in a different terminal)
npx hardhat node

# deploy contracts
npx hardhat deploy --network localhost

# verify a randomly generated passport
npx hardhat provePassport --network localhost
# verify an existing passport
npx hardhat provePassport --network localhost --passportJson <path to passport json file>

# add a certificate to the registry
npx hardhat addCert --type <csca|ds> --subject <path to certificate to add> --issuer <path to csca certificate that signed subject>
```