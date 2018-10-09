var testtoken1 = artifacts.require("./testtoken1.sol");
var testtoken1Sale = artifacts.require("./testtoken1Sale.sol");

module.exports = function(deployer) {
  deployer.deploy(testtoken1, 1000000).then(function() {
  	var tokenPrice = 1000000000000000;
  	return deployer.deploy(testtoken1Sale, testtoken1.address, tokenPrice);
  });
};
