import { normalizePath } from '@neo-one/utils';
import * as path from 'path';
import { helpers } from '../../../__data__';

describe('ImportDeclarationCompiler', () => {
  test('basic imports at import/entry.ts', async () => {
    await helpers.executeSnippet(normalizePath(path.join('import', 'entry.ts')));
  });

  test('export = unsupported', async () => {
    helpers.compileString(
      `
      const x = 'foo';

      export = x;
    `,
      { type: 'error' },
    );
  });

  test('import = unsupported', async () => {
    helpers.compileString(
      `
      import x = require('x');
    `,
      { type: 'error' },
    );
  });
});
