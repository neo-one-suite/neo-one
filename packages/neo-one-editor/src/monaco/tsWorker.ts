// tslint:disable no-implicit-dependencies no-submodule-imports promise-function-async
import {
  lib_dts,
  lib_esnext_dts,
  // @ts-ignore
} from '!../loaders/libDTSLoaderEntry!../../../../node_modules/typescript/lib/lib.esnext.d.ts';
// @ts-ignore
import scLibICOContents from '!raw-loader!../../../neo-one-smart-contract-lib/src/ICO.ts';
// @ts-ignore
import scLibIndexContents from '!raw-loader!../../../neo-one-smart-contract-lib/src/index.ts';
// @ts-ignore
import scLibTokenContents from '!raw-loader!../../../neo-one-smart-contract-lib/src/Token.ts';
// @ts-ignore
import scGlobalContents from '!raw-loader!../../../neo-one-smart-contract/src/global.d.ts';
// @ts-ignore
import scHarnessContents from '!raw-loader!../../../neo-one-smart-contract/src/harness.d.ts';
// @ts-ignore
import scIndexContents from '!raw-loader!../../../neo-one-smart-contract/src/index.d.ts';
import { getSemanticDiagnostics } from '@neo-one/smart-contract-compiler';
import { normalizePath, utils } from '@neo-one/utils';
// @ts-ignore
import { TPromise } from 'monaco-editor/esm/vs/base/common/winjs.base';
import ts from 'typescript';

import IWorkerContext = monaco.worker.IWorkerContext;
// tslint:disable-next-line no-any
type Promise<T1 = any, T2 = any> = monaco.Promise<T1, T2>;
const Promise: typeof monaco.Promise = TPromise;

const throwUnsupported = () => {
  throw new Error('Unsupported');
};

const globalSCFileName = 'sc:global.d.ts';
const defaultLibName = 'lib:lib.esnext.d.ts';

const SC_FILES: { readonly [key: string]: string } = {
  [globalSCFileName]: scGlobalContents,
  'sc:index.d.ts': scIndexContents,
  'sc:harness.d.ts': scHarnessContents,
  'scLib:index.ts': scLibIndexContents,
  'scLib:Token.ts': scLibTokenContents,
  'scLib:ICO.ts': scLibICOContents,
};

const LIB_FILES: { readonly [key: string]: string } = {
  [defaultLibName]: lib_esnext_dts,
  'lib:lib.d.ts': lib_dts,
};

const createCompilerHost = (host: TypeScriptWorker) => ({
  getAllTypescriptFilesInDir: throwUnsupported,
  createSnippetFile: throwUnsupported,
  getSmartContractPath: (value: string) => `sc:${value}`,
  getSmartContractLibPath: (value: string) => `scLib:${value}`,
  createLanguageServiceHost(
    rootNamesIn: ReadonlyArray<string>,
    options: ts.CompilerOptions,
    withTestHarness = false,
  ): ts.LanguageServiceHost {
    const smartContractModule = this.getSmartContractPath('index.d.ts');
    const smartContractFiles = [
      this.getSmartContractPath('global.d.ts'),
      smartContractModule,
      withTestHarness ? this.getSmartContractPath('harness.d.ts') : undefined,
    ].filter(utils.notNull);

    const rootNames = [...new Set(rootNamesIn.concat(smartContractFiles))].map(normalizePath);

    const smartContractLibModule = this.getSmartContractLibPath('index.ts');
    function resolveModuleNames(moduleNames: string[], containingFile: string): ts.ResolvedModule[] {
      const mutableResolvedModules: ts.ResolvedModule[] = [];
      // tslint:disable-next-line no-loop-statement
      for (const moduleName of moduleNames) {
        // tslint:disable-next-line prefer-switch
        if (moduleName === '@neo-one/smart-contract') {
          mutableResolvedModules.push({ resolvedFileName: smartContractModule });
        } else if (moduleName === '@neo-one/smart-contract-lib') {
          mutableResolvedModules.push({ resolvedFileName: smartContractLibModule });
        } else if (containingFile.startsWith('scLib')) {
          mutableResolvedModules.push({ resolvedFileName: `scLib:${moduleName.slice('./'.length)}.ts` });
        } else if (containingFile.startsWith('sc')) {
          mutableResolvedModules.push({ resolvedFileName: `sc:${moduleName.slice('./'.length)}.d.ts` });
        } else {
          const result = ts.resolveModuleName(moduleName, containingFile, options, {
            fileExists: () => false,
            readFile: () => {
              throw new Error('Not Supported');
            },
          });
          // tslint:disable-next-line no-non-null-assertion
          mutableResolvedModules.push(result.resolvedModule!);
        }
      }

      return mutableResolvedModules;
    }

    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => [...rootNames],
      getScriptVersion: () => '0',
      getScriptSnapshot: (fileName) => {
        if (servicesHost.fileExists !== undefined) {
          const exists = servicesHost.fileExists(fileName);
          if (exists && servicesHost.readFile !== undefined) {
            const result = servicesHost.readFile(fileName);

            if (result !== undefined) {
              return ts.ScriptSnapshot.fromString(result);
            }
          }
        }

        return host.getScriptSnapshot(fileName);
      },
      getCurrentDirectory: () => '',
      getCompilationSettings: () => options,
      getDefaultLibFileName: () => globalSCFileName,
      resolveModuleNames,
    };

    return servicesHost;
  },
});

export class TypeScriptWorker implements ts.LanguageServiceHost {
  private static clearFiles(diagnostics: ReadonlyArray<ts.Diagnostic>) {
    // Clear the `file` field, which cannot be JSON'yfied because it
    // contains cyclic data structures.
    diagnostics.forEach((diag) => {
      // tslint:disable-next-line no-object-mutation
      diag.file = undefined;
      const related = diag.relatedInformation as ts.Diagnostic[] | undefined;
      if (related !== undefined) {
        related.forEach((diag2) => {
          // tslint:disable-next-line no-object-mutation
          diag2.file = undefined;
        });
      }
    });
  }

  public readonly resolveModuleNames?: ts.LanguageServiceHost['resolveModuleNames'];
  private readonly ctx: IWorkerContext;
  // tslint:disable-next-line no-null-keyword
  private readonly extraLibs: { readonly [fileName: string]: string } = Object.create(null);
  private readonly languageService = ts.createLanguageService(this);
  private readonly compilerOptions: ts.CompilerOptions;
  private readonly isSmartContract: boolean;

  public constructor(ctx: IWorkerContext, createData: ICreateData) {
    this.ctx = ctx;
    this.compilerOptions = createData.compilerOptions;
    this.extraLibs = createData.extraLibs;
    this.isSmartContract = createData.isSmartContract;

    if (this.isSmartContract) {
      this.resolveModuleNames = createCompilerHost(this).createLanguageServiceHost(
        [],
        this.compilerOptions,
        true,
      ).resolveModuleNames;
    }
  }

  public getCompilationSettings(): ts.CompilerOptions {
    return this.compilerOptions;
  }

  // tslint:disable-next-line readonly-array
  public getScriptFileNames(): string[] {
    const models = this.ctx.getMirrorModels().map((model) => model.uri.toString());

    const fileNames = models.concat(Object.keys(this.extraLibs));
    if (this.isSmartContract) {
      return fileNames.concat(Object.keys(SC_FILES));
    }

    return fileNames.concat(Object.keys(LIB_FILES));
  }

  public getScriptVersion(fileName: string): string {
    const model = this.getModel(fileName);
    if (model) {
      return model.version.toString();
    }

    if (this.isDefaultLibFileName(fileName) || fileName in this.extraLibs) {
      // extra lib and default lib are static
      return '1';
    }

    return '2';
  }

  public getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
    let text: string;
    const model = this.getModel(fileName);
    if (model) {
      text = model.getValue();
    } else if (fileName in this.extraLibs) {
      text = this.extraLibs[fileName];
    } else if ((SC_FILES[fileName] as string | undefined) !== undefined) {
      text = SC_FILES[fileName];
    } else if ((LIB_FILES[fileName] as string | undefined) !== undefined) {
      text = LIB_FILES[fileName];
    } else {
      return undefined;
    }

    return {
      getText: (start, end) => text.substring(start, end),
      getLength: () => text.length,
      getChangeRange: () => undefined,
    };
  }

  public getScriptKind?(fileName: string): ts.ScriptKind {
    const suffix = fileName.substr(fileName.lastIndexOf('.') + 1);
    switch (suffix) {
      case 'ts':
        return ts.ScriptKind.TS;
      case 'tsx':
        return ts.ScriptKind.TSX;
      case 'js':
        return ts.ScriptKind.JS;
      case 'jsx':
        return ts.ScriptKind.JSX;
      default:
        return this.getCompilationSettings().allowJs ? ts.ScriptKind.JS : ts.ScriptKind.TS;
    }
  }

  public getCurrentDirectory(): string {
    return '';
  }

  public getDefaultLibFileName(_options: ts.CompilerOptions): string {
    return this.isSmartContract ? globalSCFileName : defaultLibName;
  }

  public isDefaultLibFileName(fileName: string): boolean {
    return fileName === this.getDefaultLibFileName(this.compilerOptions);
  }

  // --- language features

  public readonly getSyntacticDiagnostics = (fileName: string): Promise<ReadonlyArray<ts.Diagnostic>> => {
    const diagnostics = this.languageService.getSyntacticDiagnostics(fileName);
    TypeScriptWorker.clearFiles(diagnostics);

    return Promise.as(diagnostics);
  };

  public readonly getSemanticDiagnostics = (fileName: string): Promise<ReadonlyArray<ts.Diagnostic>> => {
    const diagnostics = this.isSmartContract
      ? getSemanticDiagnostics(fileName, this.languageService, createCompilerHost(this))
      : this.languageService.getSemanticDiagnostics(fileName);
    TypeScriptWorker.clearFiles(diagnostics);

    return Promise.as(diagnostics);
  };

  public readonly getCompilerOptionsDiagnostics = (_fileName: string): Promise<ReadonlyArray<ts.Diagnostic>> => {
    const diagnostics = this.languageService.getCompilerOptionsDiagnostics();
    TypeScriptWorker.clearFiles(diagnostics);

    return Promise.as(diagnostics);
  };

  public readonly getCompletionsAtPosition = (
    fileName: string,
    position: number,
  ): Promise<ts.CompletionInfo | undefined> =>
    Promise.as(this.languageService.getCompletionsAtPosition(fileName, position, undefined));

  public readonly getCompletionEntryDetails = (
    fileName: string,
    position: number,
    entry: string,
  ): Promise<ts.CompletionEntryDetails | undefined> =>
    Promise.as(
      this.languageService.getCompletionEntryDetails(fileName, position, entry, undefined, undefined, undefined),
    );

  public readonly getSignatureHelpItems = (
    fileName: string,
    position: number,
  ): Promise<ts.SignatureHelpItems | undefined> =>
    Promise.as(this.languageService.getSignatureHelpItems(fileName, position, undefined));

  public readonly getQuickInfoAtPosition = (fileName: string, position: number): Promise<ts.QuickInfo | undefined> =>
    Promise.as(this.languageService.getQuickInfoAtPosition(fileName, position));

  public readonly getOccurrencesAtPosition = (
    fileName: string,
    position: number,
  ): Promise<ReadonlyArray<ts.ReferenceEntry> | undefined> =>
    // tslint:disable-next-line deprecation
    Promise.as(this.languageService.getOccurrencesAtPosition(fileName, position));

  public readonly getDefinitionAtPosition = (
    fileName: string,
    position: number,
  ): Promise<ReadonlyArray<ts.DefinitionInfo> | undefined> =>
    Promise.as(this.languageService.getDefinitionAtPosition(fileName, position));

  public readonly getReferencesAtPosition = (
    fileName: string,
    position: number,
  ): Promise<ReadonlyArray<ts.ReferenceEntry> | undefined> =>
    Promise.as(this.languageService.getReferencesAtPosition(fileName, position));

  public readonly getNavigationBarItems = (fileName: string): Promise<ReadonlyArray<ts.NavigationBarItem>> =>
    Promise.as(this.languageService.getNavigationBarItems(fileName));

  public readonly getFormattingEditsForDocument = (
    fileName: string,
    options: ts.FormatCodeOptions,
  ): Promise<ReadonlyArray<ts.TextChange>> =>
    Promise.as(this.languageService.getFormattingEditsForDocument(fileName, options));

  public readonly getFormattingEditsForRange = (
    fileName: string,
    start: number,
    end: number,
    options: ts.FormatCodeOptions,
  ): Promise<ReadonlyArray<ts.TextChange>> =>
    Promise.as(this.languageService.getFormattingEditsForRange(fileName, start, end, options));

  public readonly getFormattingEditsAfterKeystroke = (
    fileName: string,
    postion: number,
    ch: string,
    options: ts.FormatCodeOptions,
  ): Promise<ReadonlyArray<ts.TextChange>> =>
    Promise.as(this.languageService.getFormattingEditsAfterKeystroke(fileName, postion, ch, options));

  public readonly getEmitOutput = (fileName: string): Promise<ts.EmitOutput> =>
    Promise.as(this.languageService.getEmitOutput(fileName));

  private getModel(fileName: string): monaco.worker.IMirrorModel | undefined {
    return this.ctx.getMirrorModels().find((model) => model.uri.toString() === fileName);
  }
}

export interface ICreateData {
  readonly compilerOptions: ts.CompilerOptions;
  readonly extraLibs: { readonly [path: string]: string };
  readonly isSmartContract: boolean;
}

export function create(ctx: IWorkerContext, createData: ICreateData): TypeScriptWorker {
  return new TypeScriptWorker(ctx, createData);
}
