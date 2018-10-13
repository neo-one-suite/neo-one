import { assertStateDescriptorType } from '../../models';

describe('State Descriptor Type Model', () => {
  test('Assert Function', () => {
    const goodType = 0x40;
    const isType = assertStateDescriptorType(goodType);

    expect(isType).toBeTruthy();
  });

  test('Errors', () => {
    const badType = 0x00;
    const assertThrow = () => assertStateDescriptorType(badType);

    expect(assertThrow).toThrowError(`Expected StateDescriptorType, found: ${badType}`);
  });
});
