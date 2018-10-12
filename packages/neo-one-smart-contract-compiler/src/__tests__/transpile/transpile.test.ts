import * as path from 'path';
import { helpers } from '../../__data__';

describe.only('transpile', () => {
  test('should concatenate files', async () => {
    await helpers.transpileAndExecuteSnippet(path.join('import', 'entry.ts'));
  });
});
