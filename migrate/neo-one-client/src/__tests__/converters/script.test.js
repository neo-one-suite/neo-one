/* @flow */
import script from '../../converters/script';

const scriptString = 'cef0c0fdcfe7838eff6ff104f9cdec2922297537';
const scriptBuffer = Buffer.from(scriptString, 'hex');

describe('script', () => {
  test('converts string to Buffer', () => {
    expect(script(scriptString)).toEqual(scriptBuffer);
  });

  test('converts Buffer to Buffer', () => {
    expect(script(scriptBuffer)).toEqual(scriptBuffer);
  });

  test('throws on other input', () => {
    try {
      // $FlowFixMe
      script({});
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });
});
