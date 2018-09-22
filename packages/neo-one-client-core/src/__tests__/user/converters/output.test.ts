import { factory, keys } from '../../../__data__';
import { output } from '../../../user/converters/output';

describe('output', () => {
  test('converts to output', () => {
    const value = factory.createOutput();

    const result = output(value);

    expect(result.asset).toMatchSnapshot();
    expect(result.address).toEqual(keys[0].scriptHash);
    expect(result.value.toString(10)).toEqual('1000000000');
  });
});
