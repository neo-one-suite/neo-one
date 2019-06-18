// tslint:disable
import { Hash256 } from '@neo-one/client';
import BigNumber from 'bignumber.js';
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(60000);

describe('Token', () => {
  test('allows minting tokens', async () => {
    // @ts-ignore
    await withContracts(async ({ token }) => {
      expect(token).toBeDefined();

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
    });
  });
});
