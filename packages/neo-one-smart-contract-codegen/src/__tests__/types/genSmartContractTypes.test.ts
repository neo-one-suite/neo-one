import { nep5 } from '../../__data__';
import { genSmartContractTypes } from '../../types';

describe('genSmartContractTypes', () => {
  test('NEP5', () => {
    expect(genSmartContractTypes('Token', nep5.abi(4))).toMatchSnapshot();
  });
});
