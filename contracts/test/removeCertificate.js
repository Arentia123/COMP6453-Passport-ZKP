const certificate = require("../build/contracts/Certificate.json");

const { Web3 } = require('web3');
const web3 = new Web3('http://localhost:7545');

// // Your account private key and the contract address
const privateKey = '0x04f1f7c198abfff19ddcde84170c6a687b98d4599126e9026f95b16afbc5f285';
const contractAddress = '0x6fbdd05d438aD578D5BC70fcf881ddDf6c1C6840';

const contract = new web3.eth.Contract(certificate, contractAddress);

const addCertificate = async () => {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    console.log(account);

    const _holder='0x8A934DD0d01b7745B11CD416798174c2D00497ce';
    const _signature= "0x01";
    const _state = "Active";
    const _hash = '0x1';
    const _name="hey"
    const receipt = await contract.methods.addCertificate(_holder,_signature,_state,_hash,_name).send({ from: account.address});

    console.log(receipt);
}

addCertificate();
