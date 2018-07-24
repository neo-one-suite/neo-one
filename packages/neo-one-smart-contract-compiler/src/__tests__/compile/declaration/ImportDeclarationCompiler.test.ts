import * as path from 'path';

import { helpers } from '../../../__data__';

describe('ImportDeclarationCompiler', () => {
  test('basic imports & exports at import/entry.ts', async () => {
    await helpers.executeSnippet(path.join('import', 'entry.ts'));
  });
});
