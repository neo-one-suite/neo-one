/* @flow */
import witness from '../../converters/witness';

const invocation = 'cef0c0fdcfe7838eff6ff104f9cdec2922297537';
const verification = '12cef0c0fdcfe7838eff6ff104f9cdec2922297537';

describe('witness', () => {
  test('converts to Witness', () => {
    const value = witness({ invocation, verification });
    expect({
      invocation: value.invocation,
      verification: value.verification,
    }).toEqual({
      invocation: Buffer.from(invocation, 'hex'),
      verification: Buffer.from(verification, 'hex'),
    });
  });

  test('throws on other input', () => {
    try {
      // $FlowFixMe
      witness(false);
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });
});
