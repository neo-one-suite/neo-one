import { helpers } from '../../../../__data__';

describe('Map', () => {
  test('can check instanceof', async () => {
    await helpers.executeString(`
      const x = new Map<string, number>();

      x instanceof Map;
      assertEqual(x instanceof Map, true);
    `);
  });

  test('cannot be extended', async () => {
    helpers.compileString(
      `
      class MyMap extends Map<string, number> {
      }
    `,
      { type: 'error' },
    );
  });
});
