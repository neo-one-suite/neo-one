import { helpers } from '../../../__data__';

describe('ContinueStatementCompiler', () => {
  test('Basic for-loop continue', async () => {
    await helpers.executeString(`
      let result = 0;
      for (let i = 0; i < 10; i++) {
        if (i > 1) {
          continue;
        }
        result += 10;
      }

      assertEqual(result, 20);
    `);
  });

  test('Nested for-loop continue', async () => {
    await helpers.executeString(`
      let result = 0;
      for (let i = 0; i < 10; i++) {
        if (i > 1) {
          continue;
        }
        result += 10;
        for (let j = 0; j < 10; j++) {
          if (j > 0) {
            continue;
          } else {
            result += 1;
          }
        }
      }

      assertEqual(result, 22);
    `);
  });

  test('continue label', async () => {
    await helpers.compileString(
      `
      let result = 0;
      foo:
      for (let i = 0; i < 10; i++) {
        result += 10;
        for (let j = 0; j < 10; j++) {
          if (j > 0) {
            continue foo;
          } else {
            result += 1;
          }
        }
        if (i > 1) {
          continue foo;
        }
      }

      if (result != 33) {
        throw 'Failure';
      }
    `,
      { type: 'error' },
    );
  });
});
