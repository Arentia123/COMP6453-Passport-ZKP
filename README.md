# COMP6453-Passport-ZKP

### Requirements

- For `contracts`, see below
- For `circuits`, Circom - https://docs.circom.io/getting-started/installation/ and `node.js`

### Contracts
#### Setup
`npm install`
Download Ganache,add truffle-config.js in the contract workspace,modify HARDFORK in chain to london,then goes to Remix,in the compile advanced settings,switch to london.
In the deploy manu,switch network to Dev-ganache,then deploy it.
#### Usecases
addCertificate():only holder can add certificate,only hash is required,hash would append to the Merkle tree.

removeCertificate():only holders can remove certificate,delete from Merkle tree.

getProof():return if the provided hash included in Merkle tree.

getRoot():return Merkle root.

#### Examples
In the test folder,I add some examples for javasrcipt and contract interaction.
