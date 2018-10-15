// tslint:disable no-implicit-dependencies no-submodule-imports promise-function-async
import { createCompilerHost, createFSHost, FileSystem, getSmartContractPath } from '@neo-one/local-browser';
import { getSemanticDiagnostics } from '@neo-one/smart-contract-compiler';
// @ts-ignore
import { TPromise } from 'monaco-editor/esm/vs/base/common/winjs.base';
import ts from 'typescript';

import IWorkerContext = monaco.worker.IWorkerContext;

// tslint:disable-next-line no-any
type Promise<T1 = any, T2 = any> = monaco.Promise<T1, T2>;
const Promise: typeof monaco.Promise = TPromise;

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

  // tslint:disable-next-line readonly-keyword
  public readDirectory: ts.LanguageServiceHost['readDirectory'];
  // tslint:disable-next-line readonly-keyword
  public readFile: ts.LanguageServiceHost['readFile'];
  // tslint:disable-next-line readonly-keyword
  public fileExists: ts.LanguageServiceHost['fileExists'];
  // tslint:disable-next-line readonly-keyword
  public getDirectories: ts.LanguageServiceHost['getDirectories'];

  private readonly ctx: IWorkerContext;
  // tslint:disable-next-line readonly-keyword
  private readonly languageService: ts.LanguageService;
  private readonly compilerOptions: ts.CompilerOptions;
  private readonly isSmartContract: boolean;
  // tslint:disable-next-line readonly-keyword
  private readonly fs: FileSystem;
  private readonly initPromise: Promise;

  // tslint:disable-next-line no-any
  public constructor(ctx: IWorkerContext, createData: ICreateData, fs: FileSystem) {
    this.ctx = ctx;
    this.compilerOptions = createData.compilerOptions;
    this.isSmartContract = createData.isSmartContract;
    this.fs = fs;
    const fsHost = createFSHost(this.fs);
    this.readDirectory = fsHost.readDirectory;
    this.readFile = fsHost.readFile;
    this.fileExists = fsHost.fileExists;
    this.getDirectories = fsHost.getDirectories;
    this.languageService = ts.createLanguageService(this);
    this.initPromise = Promise.wrap(undefined);
  }

  public getCompilationSettings(): ts.CompilerOptions {
    return this.compilerOptions;
  }

  // tslint:disable-next-line readonly-array
  public getScriptFileNames(): string[] {
    const fileNames = this.ctx.getMirrorModels().map((model) => model.uri.toString());
    if (this.isSmartContract) {
      return fileNames.concat([getSmartContractPath('global.d.ts'), getSmartContractPath('index.d.ts')]);
    }

    return fileNames;
  }

  public getScriptVersion(fileName: string): string {
    const model = this.getModel(fileName);
    if (model) {
      return model.version.toString();
    }

    return '-1';
  }

  public getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
    try {
      const model = this.getModel(fileName);
      const text = model ? model.getValue() : this.fs.readFileSync(fileName);

      return {
        getText: (start, end) => text.substring(start, end),
        getLength: () => text.length,
        getChangeRange: () => undefined,
      };
    } catch {
      return undefined;
    }
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

  public getDefaultLibFileName(opts: ts.CompilerOptions): string {
    const result = ts.getDefaultLibFilePath(opts);

    return `/node_modules/typescript/lib/${result.slice(2)}`;
  }

  public isDefaultLibFileName(fileName: string): boolean {
    return fileName === this.getDefaultLibFileName(this.compilerOptions);
  }

  // --- language features

  public readonly getSyntacticDiagnostics = (fileName: string): Promise<ReadonlyArray<ts.Diagnostic>> =>
    this.initPromise.then(() => {
      const diagnostics = this.languageService.getSyntacticDiagnostics(fileName);
      TypeScriptWorker.clearFiles(diagnostics);

      return Promise.as(diagnostics);
    });

  public readonly getSemanticDiagnostics = (fileName: string): Promise<ReadonlyArray<ts.Diagnostic>> =>
    this.initPromise.then(() => {
      const diagnostics = this.isSmartContract
        ? getSemanticDiagnostics(fileName, this.languageService, createCompilerHost({ fs: this.fs }))
        : this.languageService.getSemanticDiagnostics(fileName);
      TypeScriptWorker.clearFiles(diagnostics);

      return Promise.as(diagnostics);
    });

  public readonly getCompilerOptionsDiagnostics = (_fileName: string): Promise<ReadonlyArray<ts.Diagnostic>> =>
    this.initPromise.then(() => {
      const diagnostics = this.languageService.getCompilerOptionsDiagnostics();
      TypeScriptWorker.clearFiles(diagnostics);

      return Promise.as(diagnostics);
    });

  public readonly getCompletionsAtPosition = (
    fileName: string,
    position: number,
  ): Promise<ts.CompletionInfo | undefined> =>
    this.initPromise.then(() =>
      Promise.as(this.languageService.getCompletionsAtPosition(fileName, position, undefined)),
    );

  public readonly getCompletionEntryDetails = (
    fileName: string,
    position: number,
    entry: string,
  ): Promise<ts.CompletionEntryDetails | undefined> =>
    this.initPromise.then(() =>
      Promise.as(
        this.languageService.getCompletionEntryDetails(fileName, position, entry, undefined, undefined, undefined),
      ),
    );

  public readonly getSignatureHelpItems = (
    fileName: string,
    position: number,
  ): Promise<ts.SignatureHelpItems | undefined> =>
    this.initPromise.then(() => Promise.as(this.languageService.getSignatureHelpItems(fileName, position, undefined)));

  public readonly getQuickInfoAtPosition = (fileName: string, position: number): Promise<ts.QuickInfo | undefined> =>
    this.initPromise.then(() => Promise.as(this.languageService.getQuickInfoAtPosition(fileName, position)));

  public readonly getOccurrencesAtPosition = (
    fileName: string,
    position: number,
  ): Promise<ReadonlyArray<ts.ReferenceEntry> | undefined> =>
    // tslint:disable-next-line deprecation
    this.initPromise.then(() => Promise.as(this.languageService.getOccurrencesAtPosition(fileName, position)));

  public readonly getDefinitionAtPosition = (
    fileName: string,
    position: number,
  ): Promise<ReadonlyArray<ts.DefinitionInfo> | undefined> =>
    this.initPromise.then(() => Promise.as(this.languageService.getDefinitionAtPosition(fileName, position)));

  public readonly getReferencesAtPosition = (
    fileName: string,
    position: number,
  ): Promise<ReadonlyArray<ts.ReferenceEntry> | undefined> =>
    this.initPromise.then(() => Promise.as(this.languageService.getReferencesAtPosition(fileName, position)));

  public readonly getNavigationBarItems = (fileName: string): Promise<ReadonlyArray<ts.NavigationBarItem>> =>
    this.initPromise.then(() => Promise.as(this.languageService.getNavigationBarItems(fileName)));

  public readonly getFormattingEditsForDocument = (
    fileName: string,
    options: ts.FormatCodeOptions,
  ): Promise<ReadonlyArray<ts.TextChange>> =>
    this.initPromise.then(() => Promise.as(this.languageService.getFormattingEditsForDocument(fileName, options)));

  public readonly getFormattingEditsForRange = (
    fileName: string,
    start: number,
    end: number,
    options: ts.FormatCodeOptions,
  ): Promise<ReadonlyArray<ts.TextChange>> =>
    this.initPromise.then(() =>
      Promise.as(this.languageService.getFormattingEditsForRange(fileName, start, end, options)),
    );

  public readonly getFormattingEditsAfterKeystroke = (
    fileName: string,
    postion: number,
    ch: string,
    options: ts.FormatCodeOptions,
  ): Promise<ReadonlyArray<ts.TextChange>> =>
    this.initPromise.then(() =>
      Promise.as(this.languageService.getFormattingEditsAfterKeystroke(fileName, postion, ch, options)),
    );

  public readonly getEmitOutput = (fileName: string): Promise<ts.EmitOutput> =>
    this.initPromise.then(() => Promise.as(this.languageService.getEmitOutput(fileName)));

  private getModel(fileName: string): monaco.worker.IMirrorModel | undefined {
    return this.ctx.getMirrorModels().find((model) => model.uri.toString() === fileName);
  }
}

export interface ICreateData {
  readonly compilerOptions: ts.CompilerOptions;
  readonly isSmartContract: boolean;
  readonly fileSystemID: string;
}
