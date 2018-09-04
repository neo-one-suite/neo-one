import * as path from 'path';
import { helpers } from '../../__data__';

describe('transpile', () => {
  test('should concatenate files', async () => {
    await helpers.transpileAndExecuteSnippet(path.join('import', 'entry.ts'));
  });
});
