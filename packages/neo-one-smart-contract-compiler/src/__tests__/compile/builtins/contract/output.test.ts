import { helpers } from '../../../../__data__';

describe('Output', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      import { Output } from '@neo-one/smart-contract';

      class MyOutput implements Output {
      }
    `,
      { type: 'error' },
    );
  });
});
