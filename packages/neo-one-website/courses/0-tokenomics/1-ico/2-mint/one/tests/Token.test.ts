// tslint:disable
import { Hash256 } from '@neo-one/client';
import BigNumber from 'bignumber.js';
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(60000);

describe('Token', () => {
  test('allows minting tokens', async () => {
    // @ts-ignore
    await withContracts(async ({ token, accountIDs, masterAccountID }) => {
      expect(token).toBeDefined();

      // `accountIDs` contains accounts with NEO and GAS and they are preconfigured in the `client`
      const toAccountID = accountIDs[0];

      // Verify a valid mint transaction
      const mintReceipt = await token.mintTokens.confirmed({
        sendTo: [
          {
            amount: new BigNumber(10),
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

      let error: Error | undefined;
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
    });
  });
});
