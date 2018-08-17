import { setupContractTest, SetupTestResult } from '@neo-one/smart-contract-test';
import BigNumber from 'bignumber.js';
import * as path from 'path';
import { testToken } from '../__data__';

const issueValue = new BigNumber('1000000');

const setup = async () =>
  setupContractTest(path.resolve(__dirname, '..', '__data__', 'contracts', 'RedToken.ts'), 'RedToken', {
    deploy: true,
  });

describe('RedToken', () => {
  let result: SetupTestResult;
  beforeEach(async () => {
    result = await setup();
  });

  afterEach(async () => {
    await result.cleanup();
  });

  test('properties + issue + balanceOf + totalSupply + transfer', async () => {
    await testToken({
      result,
      name: 'RedToken',
      symbol: 'RT',
      decimals: 8,
      issueValue,
      transferValue: new BigNumber('10'),
      description: 'The RedToken',
      payable: false,
    });
  });
});
