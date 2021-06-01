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

  test('can create new set with args', async () => {
    await helpers.executeString(`
      const x = new Set<string>(['neo']);

      assertEqual(x.has('neo'), true);
    `);
  });

  test('cannot be extended', async () => {
    await helpers.compileString(
      `
      class MySet extends Set<string> {
      }
    `,
      { type: 'error' },
    );
  });
});
