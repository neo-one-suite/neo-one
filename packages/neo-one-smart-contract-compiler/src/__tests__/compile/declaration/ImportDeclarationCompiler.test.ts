import * as path from 'path';

import { helpers } from '../../../__data__';

describe('ImportDeclarationCompiler', () => {
  test('basic imports at import/entry.ts', async () => {
    await helpers.executeSnippet(path.join('import', 'entry.ts'));
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
});
