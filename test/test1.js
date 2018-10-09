var testtoken1 = artifacts.require("./testtoken1.sol");

contract('testtoken1', function(accounts) {
	var tokenInstance;

	it('sets the name and symbol of the token', function() {
		return testtoken1.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.name();
		}).then(function(name) {
			assert.equal(name, 'testtoken1', 'has the correct name');
			return tokenInstance.symbol();
		}).then(function(symbol) {
			assert.equal(symbol, 'TTO', 'has the correct symbol');
			return tokenInstance.standard();
		}).then(function(standard) {
			assert.equal(standard, 'testtoken1 v 1.0', 'has the right standard');
		});
	})

	it('sets the total supply upon deployment', function() {
		return testtoken1.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.totalSupply();
		}).then(function(totalSupply) {
			assert.equal(totalSupply.toNumber(), 1000000, 'sets the totalSupply to 1,000,000');
			return tokenInstance.balanceOf(accounts[0]);
		}).then(function(adminBalance) {
			assert.equal(adminBalance.toNumber(), 1000000, 'it allocates the initial supply to the admin');
		});
	})

	it('transfers ownership of the tokens', function() {
		return testtoken1.deployed().then(function(instance) {
			tokenInstance = instance;
			//test 'require' statement first by transferring something larger than the sender's balance
			//the below statement is the way we do that
			//transfer.call does not trigger a transaction
			return tokenInstance.transfer.call(accounts[1], 99999999999999999999);
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
			//the above two lines is for the require statement
			//since the transfer function contains a boolean return value 
			//we can check that here by making a transfer.call [[comment at line 38]]
			return tokenInstance.transfer.call(accounts[1], 2500, { from: accounts[0] });
		}).then(function(success) {
      		assert.equal(success, true, 'it returns true');
			return tokenInstance.transfer(accounts[1], 2500, { from: accounts[0]});
			// here transfer function creates a transaction on the blockchain
		}).then(function(receipt) {
			//event information when transfer is done is described here
			//the structure of the event test must correspond to the information in log file
			//for now this is copy pasted from github/dapp
			//this needs to be checked when i have doubt
			assert.equal(receipt.logs.length, 1, 'triggers one event'); //we say the receipt has logs
      		assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');//we dig into the logs
      		assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the account the tokens are transferred from');
     		assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the account the tokens are transferred to');
      		assert.equal(receipt.logs[0].args._value, 2500, 'logs the transfer amount');
			return tokenInstance.balanceOf(accounts[1]);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 2500, 'adds to the amount of receiving address');
			return  tokenInstance.balanceOf(accounts[0]);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 997500, 'subtracts the amount of sending address');
		});
	});

	it('approves tokens for delegated transfer', function() {
		return testtoken1.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.approve.call(accounts[1], 100);
		}).then(function(success) {
			assert.equal(success, true, 'it returns true');
			return tokenInstance.approve(accounts[1], 100, {from: accounts[0]});
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event'); //we say the receipt has logs
      		assert.equal(receipt.logs[0].event, 'Approval', 'should be the "Approval" event');//we dig into the logs
      		assert.equal(receipt.logs[0].args._owner, accounts[0], 'logs the account the tokens are authorized by');
     		assert.equal(receipt.logs[0].args._spender, accounts[1], 'logs the account the tokens are authorized to');
      		assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer amount');
      		return tokenInstance.allowance(accounts[0], accounts[1]);
		}).then(function(allowance) {
			assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated transfer');
		});
	});

	it('handles transfer of tokens for delegated transfers', function() {
		return testtoken1.deployed().then(function(instance) {
			tokenInstance = instance;
			fromAccount = accounts[2]; //account from which the tokens will be transferred
			toAccount = accounts[3];  //account to which the tokens shall be transferred
			spendingAccount = accounts[4];  //account that will act as a delegator or which have the authority to handle fromAccount
			//Transfer some tokens to fromAccount from where the initial testtokens are
			return tokenInstance.transfer(fromAccount, 100, {from: accounts[0]});
		}).then(function(receipt) {
			//Approve spendingAccount to spend 10 tokens from fromAccount
			return tokenInstance.approve(spendingAccount, 10, {from: fromAccount});
		}).then(function(receipt) {
			// Try something larger than the sender's balance
			return tokenInstance.transferFrom(fromAccount, toAccount, 9999, {from: spendingAccount});
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >=0, 'cannot transfer value more than senders balance');
			// Try transferring something more than the approve amount
			return tokenInstance.transferFrom(fromAccount, toAccount, 20, {from: spendingAccount});
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >=0, 'cannot transfer more than the approve amount');
			return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });
    	}).then(function(success) {
      		assert.equal(success, true);
      		return tokenInstance.transferFrom(fromAccount, toAccount, 10, {from: spendingAccount});
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event'); //we say the receipt has logs
      		assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');//we dig into the logs
      		assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transferred from');
     		assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transferred to');
      		assert.equal(receipt.logs[0].args._value, 10, 'logs the transfer amount');	
      		return tokenInstance.balanceOf(fromAccount);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 90, 'deducts the amount from from account');
			return tokenInstance.balanceOf(toAccount);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 10, 'adds the amount to the receiving accountnt');
			return tokenInstance.allowance(fromAccount, spendingAccount);
		}).then(function(allowance) {
			assert.equal(allowance.toNumber(), 0, 'deducts the amount from the allowance');
		});
	});
})








