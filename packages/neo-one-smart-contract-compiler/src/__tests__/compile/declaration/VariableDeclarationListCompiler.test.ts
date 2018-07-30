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

  test('binds const variables', async () => {
    await helpers.executeString(`
      const x = 0;
      if (x !== 0) {
        throw 'Failure';
      }
    `);
  });

  test('binds variable of non US charset', async () => {
    await helpers.executeString(`
      const früh = 2;
      if (früh !== 2) {
        throw 'Failure';
      }
    `);
  });

  test('binds let without initializer', async () => {
    await helpers.executeString(`
      let y;
      if (y !== undefined) {
        throw 'Failure';
      }
    `);
  });
});
