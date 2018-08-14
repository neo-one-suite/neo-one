import * as appRootDir from 'app-root-dir';
import _ from 'lodash';
import * as path from 'path';
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
  const context = createContextForPath(filePath, { withTestHarness: true });

  const nowMS = () => Math.round(Date.now());
  const start = nowMS();
  getSemanticDiagnostics({
    filePath,
    smartContractDir: path.dirname(require.resolve('@neo-one/smart-contract')),
    languageService: context.languageService,
  });
  // tslint:disable-next-line no-console
  console.log(`${nowMS() - start} ms`);
});
