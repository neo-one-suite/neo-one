import { withContracts } from '../generated/test';

jest.setTimeout(30000);

describe('Contract', () => {
  test('myFirstMethod', async () => {
    await withContracts(async ({ contract }) => {
      await expect(contract.myFirstMethod.confirmed()).resolves.toBeDefined();
    });
  });
});
