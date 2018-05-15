import { helpers } from '../../../__data__';

describe('ForStatementCompiler', () => {
  test('simple', async () => {
    await helpers.executeString(`
      let result = 0;
      for (let i = 0; i < 5; i++) {
        const x = 2;
        result += x;
      }

      if (result !== 10) {
        throw 'Failure';
      }
    `);
  });

  test('continue', async () => {
    await helpers.executeString(`
      let result = 0;
      let otherResult = 0;
      for (let i = 0; i < 5; i++) {
        const x = 2;
        const y = x;
        if (i % 2 === 0) {
          const x = 3;
          const y = x;
          otherResult += y;
          continue;
        }
        result += y;
      }

      if (result !== 4) {
        throw 'Failure';
      }

      if (otherResult !== 9) {
        throw 'Failure';
      }
    `);
  });
});
