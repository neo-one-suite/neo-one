// tslint:disable
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(60000);

describe('Token', () => {
  test('deploys', async () => {
    // @ts-ignore
    await withContracts(async ({ token }) => {
      // withContracts automatically publishes and deploys the contract
      // so if it doesn't fail and token exists, then the contract was written correctly.
      expect(token).toBeDefined();
    });
  });
});
