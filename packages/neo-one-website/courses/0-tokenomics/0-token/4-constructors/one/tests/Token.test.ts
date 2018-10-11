// tslint:disable
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
    });
  });
});
