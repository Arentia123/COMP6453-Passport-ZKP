const certificate = artifacts.require("CertificateRegistry");


module.exports = function(deployer) {
  deployer.deploy(certificate);
};
