import { nep17 } from '@neo-one/client-core';
import { genABI } from '../../abi';

describe('genABI', () => {
  test('NEP17', () => {
    expect(genABI('Token', nep17.abi(4))).toMatchSnapshot();
  });
});
