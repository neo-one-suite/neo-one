import { helpers } from '../../../../__data__';

describe('Map.prototype.size', () => {
  test('should return the size of the map', async () => {
    await helpers.executeString(`
      const x = new Map<string, number>();
      x.set('a', 1);
      x.size;
      const y = x.size;

      assertEqual(y, 1);
    `);
  });

  test('should return the "size" of the map', async () => {
    await helpers.executeString(`
      interface Mp<K, V> {
        readonly set: (key: K, value: V) => this;
        readonly size: number;
      }
      const x: Mp<string, number> | Map<string, number> = new Map<string, number>() as Mp<string, number> | Map<string, number>;
      x.set('a', 1);
      const a = 'size';
      x[a];
      const y = x[a];

      assertEqual(y, 1);
    `);
  });

  test('cannot set the size of an map', async () => {
    await helpers.compileString(
      `
      const x = new Map<string, number>();
      x.size = 4;
    `,
      { type: 'error' },
    );
  });

  test('cannot set the "size" of an map', async () => {
    await helpers.compileString(
      `
      const x: { size: number } | Map<string, number> = new Map<string, number>() as { size: number } | Map<string, number>;
      const a = 'size';
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
