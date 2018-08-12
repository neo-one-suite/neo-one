import { abi } from '@neo-one/client';
import { genSmartContractTypes } from '../../types';

describe('genSmartContractTypes', () => {
  test('NEP5', () => {
    expect(genSmartContractTypes('Token', abi.NEP5_STATIC(4))).toMatchSnapshot();
  });
});
