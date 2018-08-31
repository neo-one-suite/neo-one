import { helpers } from '../../../../__data__';

describe('Input', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { Input } from '@neo-one/smart-contract';

      class MyInput implements Input {
      }
    `,
      { type: 'error' },
    );
  });
});
