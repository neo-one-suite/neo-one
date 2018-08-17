import { helpers } from '../../../../__data__';

describe('Array.prototype.length', () => {
  test('should return the length of the array', async () => {
    await helpers.executeString(`
      const x = [1, 2, 3];
      x.length;
      const y = x.length;

      assertEqual(y, 3);
    `);
  });

  test('should return the "length" of the array', async () => {
    await helpers.executeString(`
      const x: { length: number } | Array<number> = [1, 2, 3] as { length: number } | Array<number>;
      const a = 'length';
      x[a];
      const y = x[a];

      assertEqual(y, 3);
    `);
  });

  test('cannot set the length of an array', async () => {
    helpers.compileString(
      `
      const x = [1, 2, 3];
      x.length = 4;
    `,
      { type: 'error' },
    );
  });

  test('cannot set the "length" of an array', async () => {
    helpers.compileString(
      `
      const x: { length: number } | Array<number> = [1, 2, 3] as { length: number } | Array<number>;
      const a = 'length';
      let error: string | undefined;
      try {
        x[a] = 10;
      } catch (err) {
        error = err;
      }

      assertEqual(error, 'TypeError');
    `,
      { type: 'error' },
    );
  });
});
