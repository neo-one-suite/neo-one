import { helpers } from '../../../__data__';

describe('BooleanLiteralCompiler', () => {
  test('true', async () => {
    await helpers.executeString(`
      if (!true) {
        throw 'Failure';
      }
    `);
  });

  test('false', async () => {
    await helpers.executeString(`
      if (false) {
        throw 'Failure';
      }
    `);
  });
});
