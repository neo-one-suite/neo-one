import { nep5 } from '@neo-one/client';
import { genSmartContractTypes } from '../../types';

describe('genSmartContractTypes', () => {
  test('NEP5', () => {
    expect(genSmartContractTypes('Token', nep5.abi(4))).toMatchSnapshot();
  });
});
