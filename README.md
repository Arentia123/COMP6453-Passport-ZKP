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
addCertificate():only authority can add certificate and send it to holder's address,data signature,state,unique hash are required.

modifyState():only authority can modify certificate state,unique hash is required.

removeCertificate():only holders can remove certificate.

getCertificate():return information of certificates.

#### Examples
In the test folder,I add some examples for javasrcipt and contract interaction.
