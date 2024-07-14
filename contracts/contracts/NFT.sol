// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
//import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721 {
	uint256 public currentTokenId;

	constructor() public ERC721("Certificate registry", "CFR") {}

	function mintTo(address recipient) public payable returns (uint256) {
		uint256 newItemId = ++currentTokenId;
		_safeMint(recipient, newItemId);
		return newItemId;
	}

	function tokenURI(uint256 id) public view virtual override returns (string memory) {
		return Strings.toString(id);
	}
}