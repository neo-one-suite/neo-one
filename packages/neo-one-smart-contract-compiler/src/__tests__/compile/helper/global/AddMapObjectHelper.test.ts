import { helpers } from '../../../../__data__';

describe('AddMapObjectHelper', () => {
  test('set + get', async () => {
    await helpers.executeString(`
      const x = new Map<string, string>();
      x.set('foo', 'bar');
      if (x.get('foo') !== 'bar') {
        throw 'Failure';
      }
    `);
  });

  test('delete', async () => {
    await helpers.executeString(`
      const x = new Map<string, string>();
      if (x.delete('foo')) {
        throw 'Failure';
      }
    `);
  });

  test('set + delete + get', async () => {
    await helpers.executeString(`
      const x = new Map<string, string>();
      x.set('foo', 'bar');

      if (!x.delete('foo')) {
        throw 'Failure';
      }

      if (x.get('foo') !== undefined) {
        throw 'Failure';
      }
    `);
  });

  test('set + clear + delete + get', async () => {
    await helpers.executeString(`
      const x = new Map<string, string>();
      x.set('foo', 'bar');
      x.clear();

      if (x.delete('foo')) {
        throw 'Failure';
      }

      if (x.get('foo') !== undefined) {
        throw 'Failure';
      }
    `);
  });
});
