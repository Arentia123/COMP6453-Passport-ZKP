const certificate = require("../build/contracts/Certificate.json");

const { Web3 } = require('web3');
const web3 = new Web3('http://localhost:7545');

// // Your account private key and the contract address
const privateKey = '0x56b0ecb8deca267e1f083ce88793108691d905328b99908245fe66ae2e5f4d4f';
const contractAddress = '0x6fbdd05d438aD578D5BC70fcf881ddDf6c1C6840';

const contract = new web3.eth.Contract(certificate, contractAddress);

const removeCertificate = async () => {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    console.log(account);
    const _hash = '0x1';
    const receipt = await contract.methods.removeCertificate(_hash).send({ from: account.address});

    console.log(receipt);
}

removeCertificate();