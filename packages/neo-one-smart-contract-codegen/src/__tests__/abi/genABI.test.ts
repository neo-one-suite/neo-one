import { abi } from '@neo-one/client';
import { genABI } from '../../abi';

describe('genABI', () => {
  test('NEP5', () => {
    expect(genABI('Token', abi.NEP5_STATIC(4))).toMatchSnapshot();
  });
});
