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

  test.skip('binds binding pattern variables', async () => {
    await helpers.executeString(`
      const foo = [1, [2, { x: 3 }], 4, 5];
      const [x, [y, { x: z, a = 6 }, b = 7], ...rest] = foo;
      if (x !== 1) {
        throw 'Failure';
      }

      if (y !== 2) {
        throw 'Failure';
      }

      if (z !== 3) {
        throw 'Failure';
      }

      if (a !== 6) {
        throw 'Failure';
      }

      if (b !== 7) {
        throw 'Failure';
      }

      if (rest.length !== 2) {
        throw 'Failure';
      }

      if (rest[0] !== 4) {
        throw 'Failure';
      }

      if (rest[1] !== 5) {
        throw 'Failure';
      }
    `);
  });
});
