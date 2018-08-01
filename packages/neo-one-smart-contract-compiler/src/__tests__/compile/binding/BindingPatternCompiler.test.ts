import { helpers } from '../../../__data__';

describe('BindingPatternCompiler', () => {
  test('binds binding pattern variables', async () => {
    await helpers.executeString(`
      const s = Symbol.for('s');
      const t = Symbol.for('t');
      const foo: [number, [number, { x: number, a?: number, c: number, [s]: number, ['d']: number, 'e': number, 0: number, [t]: { ta: number } }, number?], number, number] =
        [1, [2, { x: 3, c: 8, [s]: 9, ['d']: 10, 'e': 11, 0: 12, [t]: { ta: 13 } }], 4, 5];
      const [x, [y, { x: z, a = 6, [s]: ss, ['d']: d, 'e': e, 0: f, [t]: { ta: g }, ...restObject }, b = 7], ...rest] = foo;
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

      if (ss !== 9) {
        throw 'Failure';
      }

      if (d !== 10) {
        throw 'Failure';
      }

      if (e !== 11) {
        throw 'Failure';
      }

      if (f !== 12) {
        throw 'Failure';
      }

      if (g !== 13) {
        throw 'Failure';
      }
    `);
  });
});
