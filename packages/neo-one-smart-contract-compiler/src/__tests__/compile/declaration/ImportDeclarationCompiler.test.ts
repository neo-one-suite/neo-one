import * as path from 'path';
import { helpers } from '../../../__data__';
import { normalizePath } from '../../../utils';

describe('ImportDeclarationCompiler', () => {
  test('basic imports at import/entry.ts', async () => {
    await helpers.executeSnippet(normalizePath(path.join('import', 'entry.ts')));
  });

  test('export = unsupported', async () => {
    await helpers.compileString(
      `
      const x = 'foo';

      export = x;
    `,
      { type: 'error' },
    );
  });

  test('import = unsupported', async () => {
    await helpers.compileString(
      `
      import x = require('x');
    `,
      { type: 'error' },
    );
  });
});
