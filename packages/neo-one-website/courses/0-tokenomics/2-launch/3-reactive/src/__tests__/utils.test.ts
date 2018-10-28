// tslint:disable
import { createPrivateKey } from '@neo-one/client';
import BigNumber from 'bignumber.js';
import { take } from 'rxjs/operators';
import { createTokenInfoStream$, getTokenInfo, handleMint, TokenInfoResult } from '../utils';
// @ts-ignore
import { withContracts } from '../../one/generated/test';

describe('utils', () => {
  test('getTokenInfo returns token info', async () => {
    // @ts-ignore
    await withContracts(async ({ token, networkName }) => {
      expect(token).toBeDefined();

      const toWallet = await token.client.providers.memory.keystore.addAccount({
        network: networkName,
        privateKey: createPrivateKey(),
      });

      const {
        name,
        symbol,
        amountPerNEO,
        totalSupply,
        remaining,
        icoStartTimeSeconds,
        icoDurationSeconds,
        balance,
      } = await getTokenInfo(token, toWallet.account.id.address);

      expect(name).toEqual('Eon');
      expect(symbol).toEqual('EON');
      expect(amountPerNEO.toNumber()).toEqual(100000);
      expect(totalSupply.toNumber()).toEqual(0);
      expect(remaining.toNumber()).toEqual(10_000_000_000);
      expect(icoStartTimeSeconds).toBeDefined();
      expect(icoDurationSeconds.toNumber()).toEqual(24 * 60 * 60);
      expect(balance.toNumber()).toEqual(0);
    });
  });

  test('handleMint mints tokens and createTokenInfoStream$ reacts to the mint', async () => {
    // @ts-ignore
    await withContracts(async ({ client, developerClient, token, masterAccountID }) => {
      let error: Error | undefined;
      try {
        // Note that this transaction doesn't even get relayed to the blockchain and instead immediately fails because
        // the smart contract returned false from receiving assets.
        // Here we test that the mint tokens fails before the start time of the ICO
        await handleMint(token, new BigNumber(10));
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();

      // Fast forward to the start of the ICO
      await developerClient.fastForwardOffset(60 * 60);

      const mintReceipt = await handleMint(token, new BigNumber(10));
      if (mintReceipt.result.state === 'FAULT') {
        throw new Error(mintReceipt.result.message);
      }

      expect(mintReceipt.result.state).toEqual('HALT');
      expect(mintReceipt.result.value).toEqual(true);
      expect(mintReceipt.events).toHaveLength(1);
      let event = mintReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toBeUndefined();
      expect(event.parameters.to).toEqual(masterAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(1000000);

      const stream$ = createTokenInfoStream$(client, token);
      let info = await stream$.pipe(take<TokenInfoResult>(1)).toPromise();
      expect(info.balance.toNumber()).toEqual(1000000);

      // Fast forward past the end of of the ICO
      await developerClient.fastForwardOffset(24 * 60 * 60);

      error = undefined;
      try {
        // Here we test that the mint tokens fails after the end time of the ICO
        await handleMint(token, new BigNumber(10));
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();

      info = await stream$.pipe(take<TokenInfoResult>(1)).toPromise();
      expect(info.balance.toNumber()).toEqual(1000000);
    });
  });
});
