// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract CertificateRegistry{
    mapping (string => Certification) public registry;
    struct Certification{
        address issuer;
        address holder;
        string signature;
        string state;
        string name;
    }
    modifier onlyHolder(string memory hash){
        require(registry[hash].holder==msg.sender,"Access Denied");
        _;
    }
    address owner;
    constructor(){
        owner=msg.sender;
    }
    modifier onlyIssuer(){
        require(msg.sender==owner,"Access Denied");
        _;
    }
    function addCertificate(address _holder,
        string memory _signature,
        string memory _state,
        string memory _hash,
        string memory _name) public onlyIssuer{
        registry[_hash].holder=_holder;
        registry[_hash].issuer=msg.sender;
        registry[_hash].signature=_signature;
        registry[_hash].state=_state;
        registry[_hash].name=_name;
    }

    function removeCertificate(string memory _hash) onlyHolder(_hash) public{
        delete registry[_hash];
    }

    function getCertificate(string memory _hash) public view returns(
        address,
        address,
        string memory,
        string memory,
        string memory
    ){
        return (registry[_hash].holder,
        registry[_hash].issuer,
        registry[_hash].signature,
        registry[_hash].state,
        registry[_hash].name);
    }

    function modifyState(string memory _hash,string memory _state) onlyIssuer() public{
        registry[_hash].state=_state;
    }

}