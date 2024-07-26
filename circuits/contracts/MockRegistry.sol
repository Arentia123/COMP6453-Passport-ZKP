pragma solidity ^0.8.20;

interface IRegistry {
    function getRoot() external view returns (uint256);
}

contract MockRegistry is IRegistry {
    uint256 public root;

    constructor(uint256 _root) {
        root = _root;
    }

    function getRoot() external view override returns (uint256) {
        return root;
    }
}