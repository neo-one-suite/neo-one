// tslint:disable
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(60000);

describe('Token', () => {
  test('has name, symbol and decimals properties', async () => {
    // @ts-ignore
    await withContracts(async ({ token }) => {
      expect(token).toBeDefined();

      const [name, symbol, decimals] = await Promise.all([token.name(), token.symbol(), token.decimals()]);
      expect(name).toEqual('Eon');
      expect(symbol).toEqual('EON');
      expect(decimals.toNumber()).toEqual(8);
    });
  });
});
