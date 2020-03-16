import { helpers } from '../../../__data__';

describe('BooleanLiteralCompiler', () => {
  test.only('true', async () => {
    await helpers.executeString(`
      if (!true) {
        throw 'Failure';
      }
    `);
  });

  test('false', async () => {
    await helpers.executeString(`
      const x: boolean = false as boolean;
      if (x) {
        throw 'Failure';
      }
    `);
  });
});
