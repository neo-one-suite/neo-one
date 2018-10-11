// tslint:disable
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(30000);

describe('Token', () => {
  test('has name, symbol, decimals and totalSupply properties', async () => {
    // @ts-ignore
    await withContracts(async ({ token }) => {
      expect(token).toBeDefined();

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.totalSupply(),
      ]);
      expect(name).toEqual('Eon');
      expect(symbol).toEqual('EON');
      expect(decimals.toNumber()).toEqual(8);
      expect(totalSupply.toNumber()).toEqual(0);
    });
  });
});
