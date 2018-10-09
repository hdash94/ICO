var testtoken1Sale = artifacts.require("./testtoken1Sale.sol");
var testtoken1 = artifacts.require("./testtoken1.sol");

contract('testtoken1Sale', function(accounts) {
	var tokenInstance;
	var tokenSaleInstance;
	var tokenPrice = 1000000000000000; //value is in wei
	var buyer = accounts[1];
	var admin = accounts[0];
	var tokenAvailable = 750000;
	var nooftokens;

	it('initialises the contract with the correct values', function() {
		return testtoken1Sale.deployed().then(function(instance) {
			tokenSaleInstance = instance;
			return tokenSaleInstance.address   //there is no semicolon at the end of the line here
		}).then(function(address) {
			assert.notEqual(address, 0x0, 'has contract address');
			return tokenSaleInstance.testtokenContract();           //this checks if the testtoken1 is listed in the pressent contract
		}).then(function(address) {
			assert.notEqual(address, 0x0, 'has testteoken1 contract address listed in the present contract');
			return tokenSaleInstance.tokenPrice();
		}).then(function(price) {
			assert.equal(price, tokenPrice, 'token price is correct');
		});
	});

	it('facilitates token buying', function() {
		return testtoken1.deployed().then(function(instance) {
			//Grab token Instance first
			tokenInstance = instance;
			return testtoken1Sale.deployed();
		}).then(function(instance) {
			//Then grab tokensale instance
			tokenSaleInstance = instance;
			//Provision 75% of total supply to the dapp token Sale
			return tokenInstance.transfer(tokenSaleInstance.address, tokenAvailable, {from: admin});
		}).then(function(receipt) {
			//no of tokens to be bought
			nooftokens = 10;
			return tokenSaleInstance.buyToken(nooftokens, {from: buyer, value: nooftokens * tokenPrice });
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event'); //we say the receipt has logs
      		assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');//we dig into the logs
      		assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
     		assert.equal(receipt.logs[0].args._amount, nooftokens, 'logs the no of tokens purchased');
			return tokenSaleInstance.tokenSold();
		}).then(function(amount) {
			assert.equal(amount.toNumber(), nooftokens, 'increments the no of tokens sold');
			return tokenInstance.balanceOf(buyer);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), nooftokens);
			return tokenInstance.balanceOf(tokenSaleInstance.address);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), tokenAvailable - nooftokens);
			//try to buy the tokens different from the value
			return tokenSaleInstance.buyToken(nooftokens, {from: buyer, value: 1});
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >=0, 'msg.value must equal number of tokens in wei');
			return tokenSaleInstance.buyToken(800000, {from: buyer, value: nooftokens * tokenPrice });
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >=0, 'Cannot purchase more than tokens available');
		});
	});

	it('ends the token sale', function() {
		return testtoken1.deployed().then(function(instance) {
			//Grab token Instance first
			tokenInstance = instance;
			return testtoken1Sale.deployed();
		}).then(function(instance) {
			//Then grab tokensale instance
			tokenSaleInstance = instance;
			//try to end sale any other rhan admin
			return tokenSaleInstance.endSale({from: buyer });
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'must be admin to end sale');
			return tokenSaleInstance.endSale({from: admin });
		}).then(function(receipt) {
			return tokenInstance.balanceOf(admin);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 999990, 'return unsold tokens to admin');
			//token price reset when self destruct is called 
			//check the source code github for updates
			/*return tokenSaleInstance.tokenPrice();
		}).then(function(price) {
			assert.equal(price.toNumber(), 0, 'token price was reset');*/
		})
	})
})















