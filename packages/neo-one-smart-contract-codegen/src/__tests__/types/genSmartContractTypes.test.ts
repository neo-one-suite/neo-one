import { nep17 } from '../../__data__';
import { genSmartContractTypes } from '../../types';

describe('genSmartContractTypes', () => {
  test('NEP17', () => {
    expect(genSmartContractTypes('Token', nep17.abi(4))).toMatchSnapshot();
  });
});
