import { helpers } from '../../../../__data__';

describe('console', () => {
  test('cannot be implemented', async () => {
    helpers.compileString(
      `
      class MyConsole implements Console {
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be extended', async () => {
    helpers.compileString(
      `
      class MyFunction extends Console {
      }
    `,
      { type: 'error' },
    );
  });
});
