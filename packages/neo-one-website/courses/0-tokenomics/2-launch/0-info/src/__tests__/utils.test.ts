// tslint:disable
import { getTokenInfo } from '../utils';
// @ts-ignore
import { withContracts } from '../../one/generated/test';

describe('utils', () => {
  test('getTokenInfo returns token info', async () => {
    // @ts-ignore
    await withContracts(async ({ token }) => {
      expect(token).toBeDefined();

      const {
        name,
        symbol,
        amountPerNEO,
        totalSupply,
        remaining,
        icoStartTimeSeconds,
        icoDurationSeconds,
      } = await getTokenInfo(token);

      expect(name).toEqual('Eon');
      expect(symbol).toEqual('EON');
      expect(amountPerNEO.toNumber()).toEqual(100000);
      expect(totalSupply.toNumber()).toEqual(0);
      expect(remaining.toNumber()).toEqual(10_000_000_000);
      expect(icoStartTimeSeconds).toBeDefined();
      expect(icoDurationSeconds.toNumber()).toEqual(24 * 60 * 60);
    });
  });
});
