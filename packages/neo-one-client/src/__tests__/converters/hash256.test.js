/* @flow */
import hash256 from '../../converters/hash256';

const hash256String =
  '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f79';
const hash256StringBuffer = Buffer.from(
  '798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
  'hex',
);

describe('hash256', () => {
  test('converts string to hash', () => {
    expect(hash256(hash256String)).toEqual(hash256StringBuffer);
  });

  test('converts buffer to hash', () => {
    expect(hash256(hash256StringBuffer)).toEqual(hash256StringBuffer);
  });

  test('throws on other input', () => {
    try {
      // $FlowFixMe
      hash256({});
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });
});
