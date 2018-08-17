import { factory } from '../../../__data__';
import { input } from '../../../user/converters/input';

describe('input', () => {
  test('converts to input', () => {
    const value = factory.createInput();

    const result = input(value);

    expect(result.hash).toMatchSnapshot();
    expect(result.index).toEqual(value.index);
  });
});
