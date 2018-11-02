import { withContracts } from '../generated/test';

jest.setTimeout(60000);

describe('Contract', () => {
  test('myFirstMethod', async () => {
    await withContracts(async ({ contract }) => {
      await expect(contract.myFirstMethod.confirmed()).resolves.toBeDefined();
    });
  });
});
