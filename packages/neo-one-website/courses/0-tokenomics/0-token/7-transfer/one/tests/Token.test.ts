// tslint:disable
import BigNumber from 'bignumber.js';
import { createPrivateKey } from '@neo-one/client';
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(30000);

describe('Token', () => {
  test('has NEP-5 properties and methods', async () => {
    // @ts-ignore
    await withContracts(async ({ client, token, networkName, masterAccountID }) => {
      expect(token).toBeDefined();

      const toWallet = await client.providers.memory.keystore.addAccount({
        network: networkName,
        privateKey: createPrivateKey(),
      });

      const [name, symbol, decimals, totalSupply, initialBalance, owner] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
        token.balanceOf(toWallet.account.id.address),
        token.owner(),
      ]);
      expect(name).toEqual('Eon');
      expect(symbol).toEqual('EON');
      expect(decimals.toNumber()).toEqual(8);
      expect(totalSupply.toNumber()).toEqual(0);
      expect(initialBalance.toNumber()).toEqual(0);
      expect(owner).toEqual(masterAccountID.address);

      const amount = new BigNumber(10);
      const issueReceipt = await token.issue.confirmed(toWallet.account.id.address, amount);
      if (issueReceipt.result.state === 'FAULT') {
        throw new Error(issueReceipt.result.message);
      }

      expect(issueReceipt.events).toHaveLength(1);
      let event = issueReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toBeUndefined();
      expect(event.parameters.to).toEqual(toWallet.account.id.address);
      expect(event.parameters.amount.toNumber()).toEqual(amount.toNumber());

      const [ownerBalance, issueBalance, issueTotalSupply] = await Promise.all([
        token.balanceOf(masterAccountID.address),
        token.balanceOf(toWallet.account.id.address),
        token.totalSupply(),
      ]);
      expect(ownerBalance.toNumber()).toEqual(0);
      expect(issueBalance.toNumber()).toEqual(amount.toNumber());
      expect(issueTotalSupply.toNumber()).toEqual(amount.toNumber());

      const failedIssueReceipt = await token.issue.confirmed(toWallet.account.id.address, amount, {
        from: toWallet.account.id,
      });
      expect(failedIssueReceipt.result.state).toEqual('FAULT');

      const transferAmount = new BigNumber(5);
      const [successTransferReceipt, falseTransferReceipt0, falseTransferReceipt1] = await Promise.all([
        // Successful because there are sufficient funds and the from account is the toWallet
        token.transfer.confirmed(toWallet.account.id.address, masterAccountID.address, transferAmount, {
          from: toWallet.account.id,
        }),
        // Returns false because the from account is the masterAccountID (the currently selected account)
        token.transfer.confirmed(toWallet.account.id.address, masterAccountID.address, transferAmount),
        // Returns false because the from account has insufficient funds
        token.transfer.confirmed(toWallet.account.id.address, masterAccountID.address, new BigNumber(20), {
          from: toWallet.account.id,
        }),
      ]);
      if (successTransferReceipt.result.state === 'FAULT') {
        throw new Error(successTransferReceipt.result.message);
      }
      expect(successTransferReceipt.result.state).toEqual('HALT');
      expect(successTransferReceipt.result.value).toEqual(true);

      expect(successTransferReceipt.events).toHaveLength(1);
      event = successTransferReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(toWallet.account.id.address);
      expect(event.parameters.to).toEqual(masterAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(transferAmount.toNumber());

      if (falseTransferReceipt0.result.state === 'FAULT') {
        throw new Error(falseTransferReceipt0.result.message);
      }
      expect(falseTransferReceipt0.result.state).toEqual('HALT');
      expect(falseTransferReceipt0.result.value).toEqual(false);
      expect(falseTransferReceipt0.events).toHaveLength(0);

      if (falseTransferReceipt1.result.state === 'FAULT') {
        throw new Error(falseTransferReceipt1.result.message);
      }
      expect(falseTransferReceipt1.result.state).toEqual('HALT');
      expect(falseTransferReceipt1.result.value).toEqual(false);
      expect(falseTransferReceipt1.events).toHaveLength(0);

      let error: Error | undefined;
      try {
        // Note that this transfer doesn't even get relayed to the blockchain and instead immediately fails because
        // the transaction would throw an error.
        await token.transfer.confirmed(toWallet.account.id.address, masterAccountID.address, new BigNumber(-1));
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
  });
});
