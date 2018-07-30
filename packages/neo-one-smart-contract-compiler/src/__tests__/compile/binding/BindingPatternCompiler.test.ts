import { helpers } from '../../../__data__';

describe('BindingPatternCompiler', () => {
  test('binds binding pattern variables', async () => {
    await helpers.executeString(`
      const foo: [number, [number, { x: number, a?: number, c: number }, number?], number, number] = [1, [2, { x: 3, c: 8 }], 4, 5];
      const [x, [y, { x: z, a = 6, ...restObject }, b = 7], ...rest] = foo;
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

      if (restObject.c !== 8) {
        throw 'Failure';
      }
    `);
  });
});
