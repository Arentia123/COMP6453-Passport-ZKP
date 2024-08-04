pragma solidity ^0.8.20;

contract MockRegistry {
    uint256 public root;

    constructor(uint256 _root) {
        root = _root;
    }

    function getDSRoot() external view returns (uint256) {
        return root;
    }
}