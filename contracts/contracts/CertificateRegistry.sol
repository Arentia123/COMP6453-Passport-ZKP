// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import {LeanIMT, LeanIMTData} from "contracts/LeanIMT.sol";
contract CertificateRegistry{
    mapping (uint256 => Certification) public registry;
    struct Certification{
        address holder;
    }
    modifier onlyHolder(uint256 hash){
        require(registry[hash].holder==msg.sender,"Access Denied");
        _;
    }
    address owner;
    LeanIMTData public data;
    constructor(){
        owner=msg.sender;
    }
    modifier onlyIssuer(){
        require(msg.sender==owner,"Access Denied");
        _;
    }
    function addCertificate(uint256 _hash) public{
        registry[_hash].holder=msg.sender;
        LeanIMT.insert(data,_hash);

    }

    function removeCertificate(uint256 _hash) onlyHolder(_hash) public{
        delete registry[_hash];

    }

    function getCertificate(uint256 _hash) public view returns (address)
    {
        return registry[_hash].holder;
    }

    function proof(uint256 _hash) public view returns (bool) {
        return LeanIMT.has(data, _hash);
    }

    function getRoot() onlyIssuer() public view returns (uint256) {
        return LeanIMT.root(data);
    }

}