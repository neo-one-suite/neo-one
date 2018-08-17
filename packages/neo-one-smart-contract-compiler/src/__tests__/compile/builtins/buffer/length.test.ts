import { helpers } from '../../../../__data__';

describe('Array.prototype.length', () => {
  test('should return the length of the buffer', async () => {
    await helpers.executeString(`
      const x = Buffer.from('3030', 'hex');
      x.length;
      const y = x.length;

      assertEqual(y, 2);
    `);
  });

  test('should return the "length" of the buffer', async () => {
    await helpers.executeString(`
      const x: { length: number } | Buffer = Buffer.from('3030', 'hex') as { length: number } | Buffer;
      const a = 'length';
      x[a];
      const y = x[a];

      assertEqual(y, 2);
    `);
  });

  test('cannot set the length of a buffer', async () => {
    helpers.compileString(
      `
      const x = Buffer.from('3030', 'hex');
      x.length = 4;
    `,
      { type: 'error' },
    );
  });

  test('cannot set the "length" of a buffer', async () => {
    helpers.compileString(
      `
      const x: { length: number } | Buffer = Buffer.from('3030', 'hex') as { length: number } | Buffer;
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
