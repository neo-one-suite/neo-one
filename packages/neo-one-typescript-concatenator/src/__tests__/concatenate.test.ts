import { normalizePath } from '@neo-one/utils';
import appRootDir from 'app-root-dir';
import * as path from 'path';
import { testDirectoryPath } from '../__data__/helpers';
import { concatenate } from '../concatenate';

const unitTests: ReadonlyArray<string> = [
  // 'baseline',
  // 'collisions',
  // 'baselineWithSubModules',
  // 'collisionsWithSubModules',
  'constImportExports',
];

describe.only('Concatenator Testing Suite Mk 1.3b.73', () => {
  const runConcatenateTest = (entry: string) => {
    test(`${entry} concatenation test`, () => {
      const entryPath = testDirectoryPath(entry);

      const result = concatenate(entryPath);
      if (result === undefined) {
        return;
      }
      expect(result).toMatchSnapshot();
    });
  };

  unitTests.forEach(runConcatenateTest);

  test.skip('THE BIG ONE (@neo-one/utils)', () => {
    const entryPath = normalizePath(path.resolve(appRootDir.get(), 'packages', 'neo-one-utils', 'src', 'index.ts'));

    const result = concatenate(entryPath);
    if (result === undefined) {
      return;
    }
    expect(result.text).toMatchSnapshot();
  });
});
