import { pathResolve } from '@neo-one/smart-contract-compiler-node';
import * as appRootDir from 'app-root-dir';
import { concatenate } from '../concatenate';

// tslint:disable-next-line readonly-array
const concatenateSnippet = (...snippetPath: string[]) => {
  const filePath = pathResolve(
    appRootDir.get(),
    'packages',
    'neo-one-typescript-concatenator',
    'src',
    '__data__',
    'snippets',
    ...snippetPath,
  );

  return concatenate(filePath);
};

describe('concatenate', () => {
  test('import', () => {
    expect(concatenateSnippet('import', 'entry.ts')).toMatchSnapshot();
  });
});
