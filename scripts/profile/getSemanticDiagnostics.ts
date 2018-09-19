import * as appRootDir from 'app-root-dir';
import _ from 'lodash';
import * as path from 'path';
import { createCompilerHost } from '../../packages/neo-one-smart-contract-compiler-node/src/createCompilerHost';
import { createContextForPath } from '../../packages/neo-one-smart-contract-compiler/src/createContext';
import { getSemanticDiagnostics } from '../../packages/neo-one-smart-contract-compiler/src/getSemanticDiagnostics';

_.range(100).forEach(() => {
  const filePath = path.resolve(
    appRootDir.get(),
    'packages',
    'neo-one-smart-contract-compiler',
    'src',
    '__data__',
    'snippets',
    'semantic',
    'single',
    'complex.ts',
  );
  const host = createCompilerHost({});
  const context = createContextForPath(filePath, host, { withTestHarness: true });

  const nowMS = () => Math.round(Date.now());
  const start = nowMS();
  getSemanticDiagnostics({
    filePath,
    languageService: context.languageService,
    host,
  });
  // tslint:disable-next-line no-console
  console.log(`${nowMS() - start} ms`);
});
