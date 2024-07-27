// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import {LeanIMT, LeanIMTData} from "contracts/LeanIMT.sol";
contract CertificateRegistry {
    mapping (uint256 => uint256) public CA_certificates;
    mapping (uint256 => uint256) public DS_certificates;
    uint256[] internal deleted_CA;
    uint256[] internal deleted_DS;
    modifier onlyIssuer(){
        require(issuer==msg.sender,"Access Denied");
        _;
    }
    uint256 internal CA_counter;
    uint256 internal DS_counter=0;
    uint256 public CA_public;
    address issuer;

    LeanIMTData public CA_tree;
    LeanIMTData public DS_tree;

    //the contract owner is the owner of the modulus.
    constructor(uint256 CA_public_){
        CA_public=CA_public_;
        issuer=msg.sender;
        CA_counter=0;
        CA_certificates[CA_counter]=CA_public_;
        LeanIMT.insert(CA_tree,CA_public_);

    }
    //need issuer approval to add CA certificate
    function addCA_Certificate(uint256 CA_public_) onlyIssuer() public{
        for (uint i=0;i<CA_counter;i++){
            if (CA_certificates[i]==CA_public_){
                revert("Certificate has been added before");
            }
        }
        CA_counter++;
        CA_certificates[CA_counter]=CA_public_;
        LeanIMT.insert(CA_tree,CA_public_);
    }

    function addDS_Certificate(uint256 DS_public_) public{
        for (uint i=0;i<DS_counter;i++){
            if (DS_certificates[i]==DS_public_){
                revert("Certificate has been added before");
            }

        }
        DS_counter++;
        DS_certificates[DS_counter]=DS_public_;
        LeanIMT.insert(DS_tree,DS_public_);
    }

    // Removing a node from a merkle tree takes huge hash computation,so I maintained a internal array to judge.
    function removeCA_Certificate(uint256 CA_public_) onlyIssuer() public {
        for (uint256 i = 0; i < deleted_CA.length; i++) {
            if (deleted_CA[i]==CA_public_){
                revert("Certificate has been deleted before");
            }
        }
        for (uint256 i = 0; i < CA_counter+1; i++) {
            if(CA_certificates[i]==CA_public_ ){
                deleted_CA.push(CA_public_);
                break ;
            }
            else if(i==CA_counter){
                revert("Non-existing certificate");
            }
        }
    }

    function removeDS_Certificate(uint256 DS_public_) public {
        for (uint256 i = 0; i < deleted_DS.length; i++) {
            if (deleted_DS[i]==DS_public_){
                revert("Certificate has been deleted before");
            }
        }
        for (uint256 i = 0; i < DS_counter+1; i++) {
            if(DS_certificates[i]==DS_public_ ){
                deleted_DS.push(DS_public_);
                break;
            }
            else if(i==DS_counter){
                revert("Non-existing certificate");
            }
        }
    }



    function proofCA(uint256 CA_public_) public view returns (bool) {
        for (uint i=0;i<deleted_CA.length;i++){
            if (deleted_CA[i]==CA_public_){
                return false;
            }
        }
        return LeanIMT.has(CA_tree, CA_public_);
    }

    function proofDS(uint256 DS_public_) public view returns (bool) {
        for (uint i=0;i<deleted_DS.length;i++){
            if (deleted_DS[i]==DS_public_){
                return false;
            }
        }
        return LeanIMT.has(DS_tree, DS_public_);
    }

    function getCARoot() public view returns (uint256) {
        return LeanIMT.root(CA_tree);
    }

    function getDSRoot() public view returns (uint256) {
        return LeanIMT.root(DS_tree);
    }
}