// tslint:disable
import { Hash256 } from '@neo-one/client';
import BigNumber from 'bignumber.js';
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(60000);

describe('Token', () => {
  test('allows minting tokens', async () => {
    // @ts-ignore
    await withContracts(async ({ token, accountIDs, masterAccountID, developerClient, client, networkName }) => {
      expect(token).toBeDefined();

      // `accountIDs` contains accounts with NEO and GAS and they are preconfigured in the `client`
      const toAccountID = accountIDs[0];

      let error: Error | undefined;
      try {
        // Note that this transaction doesn't even get relayed to the blockchain and instead immediately fails because
        // the smart contract returned false from receiving assets.
        // Here we test that the mint tokens fails before the start time of the ICO
        await token.mintTokens.confirmed({
          sendTo: [
            {
              amount: new BigNumber(10),
              asset: Hash256.NEO,
            },
          ],
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();

      // Fast forward to the start of the ICO
      await developerClient.fastForwardOffset(60 * 60);

      // Verify a valid mint transaction
      const mintNEOAmount = new BigNumber(10);
      const mintReceipt = await token.mintTokens.confirmed({
        sendTo: [
          {
            amount: mintNEOAmount,
            asset: Hash256.NEO,
          },
        ],
      });
      if (mintReceipt.result.state === 'FAULT') {
        throw new Error(mintReceipt.result.message);
      }

      expect(mintReceipt.result.state).toEqual('HALT');
      expect(mintReceipt.result.value).toBeUndefined();
      expect(mintReceipt.events).toHaveLength(1);
      let event = mintReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toBeUndefined();
      expect(event.parameters.to).toEqual(masterAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(1000000);

      error = undefined;
      try {
        // Note that this transaction doesn't even get relayed to the blockchain and instead immediately fails because
        // the smart contract returned false from receiving the assets.
        await token.mintTokens.confirmed({
          sendTo: [
            {
              amount: new BigNumber(10),
              asset: Hash256.GAS,
            },
          ],
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();

      // Fast forward past the end of of the ICO
      await developerClient.fastForwardOffset(24 * 60 * 60);

      error = undefined;
      try {
        // Here we test that the mint tokens fails after the end time of the ICO
        await token.mintTokens.confirmed({
          sendTo: [
            {
              amount: new BigNumber(10),
              asset: Hash256.NEO,
            },
          ],
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();

      // Verify various properties have been updated to reflect the mint
      const [totalSupply, remaining, balance, toBalance] = await Promise.all([
        token.totalSupply(),
        token.remaining(),
        token.balanceOf(masterAccountID.address),
        token.balanceOf(toAccountID.address),
      ]);
      expect(totalSupply.toNumber()).toEqual(1_000_000);
      expect(remaining.toNumber()).toEqual(9_999_000_000);
      expect(balance.toNumber()).toEqual(1_000_000);
      expect(toBalance.toNumber()).toEqual(0);

      // Test that we can withdraw to an arbitrary address as long as the from account is the owner
      // (which by default, it currently is since it's the selected account)
      const withdrawReceipt = await token.withdraw.confirmed({
        sendFrom: [
          {
            amount: new BigNumber(10),
            asset: Hash256.NEO,
            to: toAccountID.address,
          },
        ],
      });
      if (withdrawReceipt.result.state === 'FAULT') {
        throw new Error(withdrawReceipt.result.message);
      }
      expect(withdrawReceipt.result.state).toEqual('HALT');
      expect(withdrawReceipt.result.value).toBeUndefined();
      const [toWalletAccount, contractAccount] = await Promise.all([
        client.getAccount(toAccountID),
        client.getAccount({
          network: networkName,
          address: token.definition.networks[networkName].address,
        }),
      ]);
      expect(toWalletAccount.balances[Hash256.NEO]).toBeDefined();
      expect(toWalletAccount.balances[Hash256.NEO].toNumber()).toEqual(mintNEOAmount.toNumber());
      expect(contractAccount.balances[Hash256.NEO]).toBeUndefined();
    });
  });
});
