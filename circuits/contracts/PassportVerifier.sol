// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IRegistry {
    function getDSRoot() external view returns (uint256);
}

interface IVerifier {
    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[2] calldata _pubSignals) external view returns (bool);
}

interface IPropVerifier {
    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[6] calldata _pubSignals) external view returns (bool);
}

contract PassportVerifier {
    event PassportPropVerified(address caller, bytes32 proofHash);
    error ProofAlreadyUsed();
    error InvalidProof();

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
    IRegistry public immutable REGISTRY;
    // verifier for passport proof with property checks
    IPropVerifier public immutable PROP_VERIFIER;

    mapping (bytes32 => bool) public proofUsed;

    constructor (address _verifier, address _registry, address _propVerifier) {
        VERIFIER = IVerifier(_verifier);
        REGISTRY = IRegistry(_registry);
        PROP_VERIFIER = IPropVerifier(_propVerifier);
    }

    /// @notice Verifies a passport validity proof
    /// @param _proof       The proof of passport validity
    /// @param _timeBuffer  The number of seconds for which the passport must be 
    ///                     valid after this block
    /// @return             True if the proof is valid, false otherwise
    function verifyPassport(PassportProof calldata _proof, uint256 _timeBuffer) public view returns (bool) {
        if (!_checkProof(_proof, _timeBuffer))
            return false;

        return VERIFIER.verifyProof(_proof.a, _proof.b, _proof.c, [_proof.expectedRoot, _proof.currentTimestamp]);
    }

    /// @notice Verifies passport including checking for age and nationality. 
    ///         Also prevents reuse of a proof on the deployed chain (not cross-chain).
    function verifyPassport(
        PassportProof calldata _proof, 
        uint256 _timeBuffer, 
        uint256 _requiredAge, 
        uint256[3] calldata _allowedNationality
    ) external {
        bytes32 proofHash = keccak256(
            abi.encodePacked(
                _proof.a, 
                _proof.b, 
                _proof.c, 
                _proof.expectedRoot, 
                _proof.currentTimestamp, 
                _requiredAge,
                _allowedNationality
            )
        );
        if (proofUsed[proofHash])
            revert ProofAlreadyUsed();
        
        if (!_checkProof(_proof, _timeBuffer))
            revert InvalidProof();
        
        if (!PROP_VERIFIER.verifyProof(
            _proof.a, 
            _proof.b, 
            _proof.c, 
            [
                _proof.expectedRoot, 
                _proof.currentTimestamp, 
                _requiredAge, 
                _allowedNationality[0], 
                _allowedNationality[1], 
                _allowedNationality[2]
            ]
        ))
            revert InvalidProof();
        
        proofUsed[proofHash] = true;
    }

    function _checkProof(PassportProof calldata _proof, uint256 _timeBuffer) internal view returns (bool) {
        if (_proof.expectedRoot != REGISTRY.getDSRoot())
            return false;
        
        if (_proof.currentTimestamp < block.timestamp + _timeBuffer)
            return false;

        return true;
    }
}
