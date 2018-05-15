import { helpers } from '../../../__data__';

describe('VariableDeclarationListCompiler', () => {
  test('binds let variables', async () => {
    await helpers.executeString(`
      let x = 0;
      if (x !== 0) {
        throw 'Failure';
      }

      x = x + 1;
      if (x !== 1) {
        throw 'Failure';
      }
    `);
  });
});
