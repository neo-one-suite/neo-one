import { factory } from '../../../__data__';
import { witness } from '../../../user/converters/witness';

describe('witness', () => {
  test('converts to witness', () => {
    const value = factory.createWitness();

    const result = witness(value);

    expect(result.invocation).toMatchSnapshot();
    expect(result.verification).toMatchSnapshot();
  });
});
