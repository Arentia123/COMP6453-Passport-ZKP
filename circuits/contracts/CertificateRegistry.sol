// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {LeanIMT, LeanIMTData} from "@zk-kit/lean-imt.sol/LeanIMT.sol";

interface ICertVerifier {
    struct CertProof {
        // proof elements
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256 expectedRoot;
        uint256 certPubkeyHash;
    }

    function verifyCert(
        CertProof calldata _proof, 
        uint256 _expectedRoot
    ) external view returns (bool, uint256);
}

contract CertificateRegistry {
    ICertVerifier immutable public CERT_VERIFIER;
    mapping (uint256 => uint256) public CA_certificates;
    mapping (uint256 => uint256) public DS_certificates;
    mapping (uint256 => bool) public deleted_CA;
    mapping (uint256 => bool) public deleted_DS;

    modifier onlyRevoker(){
        require(revoker==msg.sender,"Access Denied");
        _;
    }

    uint256 internal CA_counter;
    uint256 internal DS_counter=0;
    address public revoker;

    LeanIMTData public CA_tree;
    LeanIMTData public DS_tree;

    //the contract owner is the owner of the modulus.
    constructor(uint256[] memory CA_leaves_, address cert_verifier_) {
        revoker=msg.sender;

        uint256 num_leaves = CA_leaves_.length;
        for (uint256 i = 0; i < num_leaves; ++i)
            CA_certificates[i] = CA_leaves_[i];

        LeanIMT.insertMany(CA_tree, CA_leaves_);
        CA_counter=num_leaves;
        CERT_VERIFIER = ICertVerifier(cert_verifier_);
    }

    function addCA_Certificate(ICertVerifier.CertProof calldata proof_) public{
        if (deleted_CA[proof_.certPubkeyHash])
            revert("Certificate has been revoked");

        if (LeanIMT.has(CA_tree, proof_.certPubkeyHash))
            revert("Certificate has been added before");

        (bool success, ) = CERT_VERIFIER.verifyCert(proof_, LeanIMT.root(CA_tree));
        if (!success)
            revert("Invalid certificate proof");

        CA_certificates[CA_counter++]=proof_.certPubkeyHash;
        LeanIMT.insert(CA_tree,proof_.certPubkeyHash);
    }

    function addDS_Certificate(ICertVerifier.CertProof calldata proof_) public {
        if (deleted_DS[proof_.certPubkeyHash])
            revert("Certificate has been revoked");

        if (LeanIMT.has(DS_tree, proof_.certPubkeyHash))
            revert("Certificate has been added before");
        
        (bool success, ) = CERT_VERIFIER.verifyCert(proof_, LeanIMT.root(CA_tree));
        if (!success)
            revert("Invalid certificate proof");

        DS_certificates[DS_counter++]=proof_.certPubkeyHash;
        LeanIMT.insert(DS_tree,proof_.certPubkeyHash);
    }

    // the node must also be removed from the tree because passport verification
    // uses the root to check membership
    function removeCA_Certificate(uint256 CA_public_, uint256[] calldata siblingNodes) onlyRevoker() public {
        if (deleted_CA[CA_public_])
            revert("Certificate has been deleted before");
        
        if (!LeanIMT.has(CA_tree, CA_public_))
            revert("Non-existing certificate");
        
        LeanIMT.remove(CA_tree, CA_public_, siblingNodes);
        deleted_CA[CA_public_]=true;
    }

    // ideally, for a trustless setup, we would record the hash of the pubkey 
    // corresponding to the issuing CSCA certificate for every DS certificate,
    // then use a circuit to prove inclusion in a CRL signed by the issuing CSCA
    // however, for now we have a trusted revoker
    function removeDS_Certificate(uint256 DS_public_, uint256[] calldata siblingNodes) onlyRevoker() public {
        if (deleted_DS[DS_public_])
            revert("Certificate has been deleted before");
        
        if (!LeanIMT.has(DS_tree, DS_public_))
            revert("Non-existing certificate");

        LeanIMT.remove(DS_tree, DS_public_, siblingNodes);
        deleted_DS[DS_public_]=true;
    }

    function proofCA(uint256 CA_public_) public view returns (bool) {
        if (deleted_CA[CA_public_])
            return false;

        return LeanIMT.has(CA_tree, CA_public_);
    }

    function proofDS(uint256 DS_public_) public view returns (bool) {
        if (deleted_DS[DS_public_])
            return false;

        return LeanIMT.has(DS_tree, DS_public_);
    }

    function getCARoot() public view returns (uint256) {
        return LeanIMT.root(CA_tree);
    }

    function getDSRoot() public view returns (uint256) {
        return LeanIMT.root(DS_tree);
    }

    function getIdxOfCA(uint256 CA_public_) public view returns (uint256) {
        return LeanIMT.indexOf(CA_tree, CA_public_);
    }

    function getIdxOfDS(uint256 DS_public_) public view returns (uint256) {
        return LeanIMT.indexOf(DS_tree, DS_public_);
    }

    function getAllCALeaves() public view returns (uint256[] memory) {
        uint256 num_leaves = CA_counter;
        uint256[] memory leaves = new uint256[](num_leaves);
        for (uint256 i = 0; i < num_leaves; i++)
            leaves[i] = CA_certificates[i];
        
        return leaves;
    }

    function getAllDSLeaves() public view returns (uint256[] memory) {
        uint256 num_leaves = DS_counter;
        uint256[] memory leaves = new uint256[](num_leaves);
        for (uint256 i = 0; i < num_leaves; i++)
            leaves[i] = DS_certificates[i];
        
        return leaves;
    }
}