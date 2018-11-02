// tslint:disable
import BigNumber from 'bignumber.js';
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(60000);

describe('Token', () => {
  test('has NEP-5 properties and methods', async () => {
    // @ts-ignore
    await withContracts(async ({ token, accountIDs, masterAccountID }) => {
      expect(token).toBeDefined();

      // `accountIDs` contains accounts with NEO and GAS and they are preconfigured in the `client`
      const toAccountID = accountIDs[0];

      const [name, symbol, decimals, totalSupply, initialBalance, owner] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
        token.balanceOf(toAccountID.address),
        token.owner(),
      ]);
      expect(name).toEqual('Eon');
      expect(symbol).toEqual('EON');
      expect(decimals.toNumber()).toEqual(8);
      expect(totalSupply.toNumber()).toEqual(0);
      expect(initialBalance.toNumber()).toEqual(0);
      expect(owner).toEqual(masterAccountID.address);

      // Check that we can issue new tokens to the given address.
      const amount = new BigNumber(10);
      // Note that as long as there exists a user account configured in the `Client`, there will always be a default `from` user account that is used
      // for creating and signing transactions. The `Client` from `withContracts` is configured to use the `masterAccountID` as the default
      // `from` user account, hence we don't need to specify it explicitly here.
      const issueReceipt = await token.issue.confirmed(toAccountID.address, amount);
      if (issueReceipt.result.state === 'FAULT') {
        throw new Error(issueReceipt.result.message);
      }

      // Verify the expected transfer event was emitted.
      expect(issueReceipt.events).toHaveLength(1);
      let event = issueReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toBeUndefined();
      expect(event.parameters.to).toEqual(toAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(amount.toNumber());

      // Verify the balances and total supply have been updated to reflect the issuance of tokens.
      const [ownerBalance, issueBalance, issueTotalSupply] = await Promise.all([
        token.balanceOf(masterAccountID.address),
        token.balanceOf(toAccountID.address),
        token.totalSupply(),
      ]);
      expect(ownerBalance.toNumber()).toEqual(0);
      expect(issueBalance.toNumber()).toEqual(amount.toNumber());
      expect(issueTotalSupply.toNumber()).toEqual(amount.toNumber());

      // We explicitly specify which account to use to sign the transaction to verify that it's not possible to `issue` tokens by an
      // arbitrary user account.
      const failedIssueReceipt = await token.issue.confirmed(toAccountID.address, amount, {
        from: toAccountID,
      });
      expect(failedIssueReceipt.result.state).toEqual('FAULT');

      // Try various transfers
      const transferAmount = new BigNumber(5);
      const [successTransferReceipt, falseTransferReceipt0, falseTransferReceipt1] = await Promise.all([
        // Successful because there are sufficient funds and the from account is the toWallet
        token.transfer.confirmed(toAccountID.address, masterAccountID.address, transferAmount, {
          from: toAccountID,
        }),
        // Returns false because the from account is the masterAccountID (the currently selected account)
        token.transfer.confirmed(toAccountID.address, masterAccountID.address, transferAmount),
        // Returns false because the from account has insufficient funds
        token.transfer.confirmed(toAccountID.address, masterAccountID.address, new BigNumber(20), {
          from: toAccountID,
        }),
      ]);
      if (successTransferReceipt.result.state === 'FAULT') {
        throw new Error(successTransferReceipt.result.message);
      }
      expect(successTransferReceipt.result.state).toEqual('HALT');
      expect(successTransferReceipt.result.value).toEqual(true);

      // Verify the transfer event
      expect(successTransferReceipt.events).toHaveLength(1);
      event = successTransferReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(toAccountID.address);
      expect(event.parameters.to).toEqual(masterAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(transferAmount.toNumber());

      // Verify the failed result (returns false)
      if (falseTransferReceipt0.result.state === 'FAULT') {
        throw new Error(falseTransferReceipt0.result.message);
      }
      expect(falseTransferReceipt0.result.state).toEqual('HALT');
      expect(falseTransferReceipt0.result.value).toEqual(false);
      expect(falseTransferReceipt0.events).toHaveLength(0);

      // Verify the failed result (returns false)
      if (falseTransferReceipt1.result.state === 'FAULT') {
        throw new Error(falseTransferReceipt1.result.message);
      }
      expect(falseTransferReceipt1.result.state).toEqual('HALT');
      expect(falseTransferReceipt1.result.value).toEqual(false);
      expect(falseTransferReceipt1.events).toHaveLength(0);

      // Validate that an error is thrown on the exceptional case of -1
      let error: Error | undefined;
      try {
        // Note that this transfer doesn't even get relayed to the blockchain and instead immediately fails because
        // the transaction would throw an error.
        await token.transfer.confirmed(toAccountID.address, masterAccountID.address, new BigNumber(-1));
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
  });
});
