const certificate = require("../build/contracts/Certificate.json");

const { Web3 } = require('web3');
const web3 = new Web3('http://localhost:7545');

// // Your account private key and the contract address
const privateKey = '0xd2dc088da2ec531992dc61e9ee3477589b1d35a273bf74e8c18b7649c468c124';
const contractAddress = '0x33E786B802D565Af9eB7cd57792Cdba6e1bc85bD';

const contract = new web3.eth.Contract(certificate, contractAddress);

const addCertificate = async () => {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    const _hash = 123;
    const receipt = await contract.methods.addCertificate(_hash).send({ from: account.address});

    console.log(receipt);
}

addCertificate();
