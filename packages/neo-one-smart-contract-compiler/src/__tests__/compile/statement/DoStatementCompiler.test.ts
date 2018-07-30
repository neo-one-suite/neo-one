import { helpers } from '../../../__data__';

describe('DoStatementCompiler', () => {
  test('simple do-while block', async () => {
    await helpers.executeString(`
      let i = 0;
      let result = 0;
      do {
        result += 1;
        i += 1;
      } while (i < 2);

      if (result !== 3) {
        throw 'Failure';
      }
    `);
  });

  test('simple do-while with break', async () => {
    await helpers.executeString(`
      let i = 0;
      let result = 0;
      do {
        i += 1;
        if (i == 3) {
          break;
        }
        result += 1;
      } while (i < 10);

      if (result !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('simple do-while with continue', async () => {
    await helpers.executeString(`
      let i = 0;
      let result = 0;
      do {
        i += 1;
        if (i < 3) {
          continue;
        }
        result += 1;
      } while (i < 6);

      if (result !== 3) {
        throw 'Failure';
      }
    `);
  });
});
