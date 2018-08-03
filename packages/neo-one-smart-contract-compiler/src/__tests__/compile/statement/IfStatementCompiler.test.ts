import { helpers } from '../../../__data__';

describe('IfStatementCompiler', () => {
  test('simple if', async () => {
    await helpers.executeString(`
      if (!true) {
        throw 'Failure';
      }
    `);
  });

  test('simple if else', async () => {
    await helpers.executeString(`
      let value = false;
      if (!!false) {
        throw 'Failure';
      } else {
        value = true;
      }

      assertEqual(value, true);
    `);
  });
});
