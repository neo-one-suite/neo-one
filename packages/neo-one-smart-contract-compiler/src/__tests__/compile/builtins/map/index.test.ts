import { helpers } from '../../../../__data__';

describe('Map', () => {
  test('set + get', async () => {
    await helpers.executeString(`
      const x = new Map<string, string>();
      x.set('foo', 'bar');

      assertEqual(x.get('foo'), 'bar');
    `);
  });

  test('delete', async () => {
    await helpers.executeString(`
      const x = new Map<string, string>();

      assertEqual(x.delete('foo'), false);
    `);
  });

  test('set + delete + get', async () => {
    await helpers.executeString(`
      const x = new Map<string, string>();
      x.set('foo', 'bar');

      assertEqual(x.delete('foo'), true);
      assertEqual(x.get('foo'), undefined);
    `);
  });

  test('set + clear + delete + get', async () => {
    await helpers.executeString(`
      const x = new Map<string, string>();
      x.set('foo', 'bar');
      x.clear();

      assertEqual(x.delete('foo'), false);
      assertEqual(x.get('foo'), undefined);
    `);
  });

  test('can be extended, implemented and instanceof', async () => {
    await helpers.executeString(`
      class MyMap extends Map<string, number> implements Map<string, number> {
      }

      const x = new MyMap();
      assertEqual(x instanceof Map, true);
    `);
  });
});
