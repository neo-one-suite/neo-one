import { helpers } from '../../../../__data__';

describe('Set', () => {
  test('can check instanceof', async () => {
    await helpers.executeString(`
      const x = new Set<string>();

      new Set<string>();
      x instanceof Set;
      assertEqual(x instanceof Set, true);
    `);
  });

  test('cannot be extended', async () => {
    helpers.compileString(
      `
      class MySet extends Set<string> {
      }
    `,
      { type: 'error' },
    );
  });
});
