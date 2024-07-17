const certificate = require("../build/contracts/Certificate.json");

const { Web3 } = require('web3');
const web3 = new Web3('http://localhost:7545');

// // Your account private key and the contract address
const privateKey = '0x80eb63ef37a8d3a14835cc859a95d2c820b3568c0ece51601c526292859198bb';
const contractAddress = '0xc9795C539E4F7C337b69FB0ED38016124B56B89d';

const contract = new web3.eth.Contract(certificate, contractAddress);

const proof = async () => {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    const _hash = 123;
    const receipt = await contract.methods.proof(_hash).call({ from: account.address});

    console.log(receipt);
}

proof();