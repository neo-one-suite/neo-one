// tslint:disable no-object-mutation
import { getSemanticDiagnostics } from '@neo-one/smart-contract-compiler';
import { createCompilerHost } from '@neo-one/smart-contract-compiler-node';
import * as path from 'path';
// tslint:disable-next-line no-submodule-imports
import ts from 'typescript/lib/tsserverlibrary';

export class SmartContractPlugin {
  public create(info: ts.server.PluginCreateInfo): ts.LanguageService {
    // tslint:disable-next-line no-null-keyword
    const proxy: ts.LanguageService = Object.create(null);
    // tslint:disable-next-line no-loop-statement
    for (const k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
      const x = info.languageService[k];
      // tslint:disable-next-line no-object-mutation no-any
      proxy[k] = (...args: any[]) => (x as any).apply(info.languageService, args);
    }

    proxy.getSemanticDiagnostics = (fileName) => {
      // tslint:disable-next-line no-non-null-assertion
      const [result] = info.languageServiceHost.resolveModuleNames!(['@neo-one/smart-contract'], fileName);

      return [
        ...getSemanticDiagnostics(
          fileName,
          info.languageService,
          createCompilerHost({
            // tslint:disable-next-line no-non-null-assertion
            smartContractDir: path.dirname(result!.resolvedFileName),
          }),
        ),
      ];
    };

    return proxy;
  }
}
