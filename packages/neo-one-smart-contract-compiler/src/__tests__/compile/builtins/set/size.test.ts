import { helpers } from '../../../../__data__';

describe('Set.prototype.size', () => {
  test('should return the size of the set', async () => {
    await helpers.executeString(`
      const x = new Set<string>();
      x.add('a');
      x.size;
      const y = x.size;

      assertEqual(y, 1);
    `);
  });

  test('should return the "size" of the set', async () => {
    await helpers.executeString(`
      interface St<V> {
        readonly add: (value: V) => this;
        readonly size: number;
      }
      const x: St<string> | Set<string> = new Set<string>() as St<string> | Set<string>;
      x.add('a');
      const a = 'size';
      x[a];
      const y = x[a];

      assertEqual(y, 1);
    `);
  });

  test('cannot set the size of an set', async () => {
    await helpers.compileString(
      `
      const x = new Set<string>();
      x.size = 4;
    `,
      { type: 'error' },
    );
  });

  test('cannot set the "size" of an set', async () => {
    await helpers.compileString(
      `
      const x: { size: number } | Set<string> = new Set<string>() as { size: number } | Set<string>;
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
