import * as appRootDir from 'app-root-dir';
import * as path from 'path';
import ts from 'typescript';
import { CompilerDiagnostic } from '../CompilerDiagnostic';
import { createContextForPath } from '../createContext';
import { getSemanticDiagnostics } from '../getSemanticDiagnostics';
import { pathResolve } from '../utils';

const serializeDiagnostic = (diagnostic: ts.Diagnostic) => {
  let line: number | undefined;
  let column: number | undefined;
  if (diagnostic instanceof CompilerDiagnostic) {
    const result = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
    line = result.line;
    column = result.character;
  }

  return {
    category: diagnostic.category,
    code: diagnostic.code,
    messageText: diagnostic.messageText,
    start: diagnostic.start,
    length: diagnostic.length,
    source: diagnostic.source,
    file: diagnostic.file === undefined ? '' : path.basename(diagnostic.file.fileName),
    line,
    column,
  };
};

// tslint:disable-next-line readonly-array
const verifySnippet = (...snippetPath: string[]) => {
  const filePath = pathResolve(
    appRootDir.get(),
    'packages',
    'neo-one-smart-contract-compiler',
    'src',
    '__data__',
    'snippets',
    'semantic',
    ...snippetPath,
  );
  const context = createContextForPath(filePath, { withTestHarness: true });

  const diagnostics = getSemanticDiagnostics({
    filePath,
    smartContractDir: path.dirname(require.resolve('@neo-one/smart-contract')),
    languageService: context.languageService,
  });

  expect(diagnostics.map(serializeDiagnostic)).toMatchSnapshot();
};

describe('getSemanticDiagnostics', () => {
  test('reports errors for a simple single file', async () => {
    verifySnippet('single', 'simple.ts');
  });

  test('reports errors for a complex single file', async () => {
    verifySnippet('single', 'complex.ts');
  });
});
