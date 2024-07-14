const NFT = artifacts.require("NFT");
// const MetaCoin = artifacts.require("MetaCoin");

module.exports = function(deployer) {
  deployer.deploy(NFT);
  // deployer.link(ConvertLib, MetaCoin);
  // deployer.deploy(MetaCoin);
};
