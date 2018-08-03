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

  test('cannot set the length of an array', async () => {
    await helpers.compileString(
      `
      const x = [1, 2, 3];
      x.length = 4;
    `,
      { type: 'error' },
    );
  });
});
