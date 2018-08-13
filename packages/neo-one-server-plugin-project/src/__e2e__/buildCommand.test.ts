import * as path from 'path';

describe('buildCommand', () => {
  test('build', async () => {
    await one.execute('build', { cwd: path.resolve(__dirname, '..', '__data__', 'ico') });
  });
});
