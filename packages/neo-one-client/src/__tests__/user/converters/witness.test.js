/* @flow */
import witness from '../../../user/converters/witness';

const invocation = 'cef0c0fdcfe7838eff6ff104f9cdec2922297537';
const verification = 'fff1d0fdcfe7838eff6ff104f9cdec2922297537';

describe('witness', () => {
  test('convert to witness', () => {
    const testWitness = witness({
      invocation,
      verification,
    });
    expect({
      invocation: testWitness.invocation,
      verification: testWitness.verification,
    }).toEqual({
      invocation: Buffer.from(invocation, 'hex'),
      verification: Buffer.from(verification, 'hex'),
    });
  });
});
