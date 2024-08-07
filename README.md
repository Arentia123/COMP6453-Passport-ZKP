# COMP6453-Passport-ZKP

### Requirements

- For `contracts`, see below
- For `circuits`, Circom - https://docs.circom.io/getting-started/installation/ and `node.js`

### Circuits + Full Demo

For the zk circuits and the demo of the system, go to the `circuits` (and work
from there).

### Contracts
#### Setup
`npm install`
Download Ganache,add truffle-config.js in the contract workspace,modify HARDFORK in chain to london,then goes to Remix,in the compile advanced settings,switch to london.
In the deploy manu,switch network to Dev-ganache,then deploy it.
#### Usecases
addCA_Certificate():only issuer can add certificate,only hash is required,hash would append to the Merkle tree.
addDS_Certificate():everyone can add after verification.
removeCA_Certificate():only issuer can remove certificate
removeDS_Certificate():everyone can remove after verification.

getCA_Proof():return if the provided hash included in Merkle tree.

getCARoot():return Merkle root.
getDSRoot()
#### Examples
In the test folder,I add some examples for javasrcipt and contract interaction.
