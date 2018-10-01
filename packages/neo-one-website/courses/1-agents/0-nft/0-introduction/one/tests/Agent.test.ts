// tslint:disable
// @ts-ignore
import { withContracts } from '../generated';

jest.setTimeout(30000);

describe('Agent', () => {
  test('deploys', async () => {
    // @ts-ignore
    await withContracts(async ({ agent }) => {
      // withContracts automatically publishes and deploys the contract
      // so if it doesn't fail and agent exists, then the contract was written correctly.
      expect(agent).toBeDefined();
    });
  });
});
