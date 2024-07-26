// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IRegistry {
    function getRoot() external view returns (uint256);
}

interface IVerifier {
    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[2] calldata _pubSignals) external view returns (bool);
}

contract PassportVerifier {
    struct PassportProof {
        // proof elements
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        // the merkle root of the DS certificate merkle tree
        uint256 expectedRoot;
        // the utc unix timestamp the proof was generated for
        uint256 currentTimestamp;
    }

    // the zk proof verifier contract
    IVerifier public immutable VERIFIER;
    // the DS registry contract which tracks the merkle tree of valid DS certificates
    IRegistry public immutable DS_REGISTRY;

    constructor (address _verifier, address _dsRegistry) {
        VERIFIER = IVerifier(_verifier);
        DS_REGISTRY = IRegistry(_dsRegistry);
    }

    /// @notice Verifies a passport validity proof
    /// @param _proof       The proof of passport validity
    /// @param _timeBuffer  The number of seconds for which the passport must be 
    ///                     valid after this block
    /// @return             True if the proof is valid, false otherwise
    function verifyPassport(PassportProof calldata _proof, uint256 _timeBuffer) external view returns (bool) {
        if (_proof.expectedRoot != DS_REGISTRY.getRoot())
            return false;
        
        if (_proof.currentTimestamp < block.timestamp + _timeBuffer)
            return false;

        return VERIFIER.verifyProof(_proof.a, _proof.b, _proof.c, [_proof.expectedRoot, _proof.currentTimestamp]);
    }
}
