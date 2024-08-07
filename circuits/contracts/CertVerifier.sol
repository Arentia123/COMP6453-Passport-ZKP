// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IRegistry {
}

interface IVerifier {
    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[2] calldata _pubSignals) external view returns (bool);
}

contract CertVerifier {
    struct CertProof {
        // proof elements
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256 expectedRoot;
        uint256 certPubkeyHash;
    }

    // the zk proof verifier contract
    IVerifier public immutable VERIFIER;

    constructor (address _verifier) {
        VERIFIER = IVerifier(_verifier);
    }

    function verifyCert(
        CertProof calldata _proof, 
        uint256 _expectedRoot
    ) external view returns (bool, uint256) {
        if (_proof.expectedRoot != _expectedRoot)
            return (false, 0);

        return (
            VERIFIER.verifyProof(
                _proof.a, 
                _proof.b, 
                _proof.c, 
                [_proof.certPubkeyHash, _proof.expectedRoot]
            ),
            0
        );
    }
}