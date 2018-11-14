// tslint:disable
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
      // `masterAccountID` is the main/first account on the network and contains just under 100 million NEO and 58 million GAS.
      // It also is the account that automatically deploys the contracts.
      expect(owner).toEqual(masterAccountID.address);
    });
  });
});
