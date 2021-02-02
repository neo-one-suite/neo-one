import { helpers } from '../../../../__data__';

describe('Buffer', () => {
  test('cannot be implemented', async () => {
    await helpers.compileString(
      `
      class MyBuffer implements Buffer {
      }
    `,
      { type: 'error' },
    );
  });

  test('cannot be extended', async () => {
    await helpers.compileString(
      `
      class MyBuffer extends Buffer {
      }
    `,
      { type: 'error' },
    );
  });

  test('can be referenced and passed to functions', async () => {
    await helpers.executeString(`
      const x: [typeof Buffer] = [Buffer];

      const foo = (value: [typeof Buffer]) => {
        // do nothing
      };

      foo(x);
    `);
  });

  test('can be instanceof', async () => {
    await helpers.executeString(`
      const x = Buffer.from('5946158ab93f5f4fd6ba230f1c6c235117eec5f83e65275ac6f93ada9ca60477', 'hex');

      assertEqual(x instanceof Buffer, true);
    `);
  });
});
