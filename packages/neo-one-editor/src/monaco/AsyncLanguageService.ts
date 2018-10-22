// tslint:disable no-implicit-dependencies no-submodule-imports promise-function-async
import {
  createCompilerHost,
  createFSHost,
  getSmartContractPath,
  normalizePath,
  PouchDBFileSystem,
} from '@neo-one/local-browser';
import { getSemanticDiagnostics } from '@neo-one/smart-contract-compiler';
import { comlink } from '@neo-one/worker';
import { map } from 'rxjs/operators';
import ts from 'typescript';
import { createFileSystem } from '../engine/create';

interface Options {
  readonly compilerOptions: ts.CompilerOptions;
  readonly isSmartContract: boolean;
  readonly id: string;
  readonly endpoint: comlink.Endpoint;
  readonly fileNames: ReadonlyArray<string>;
}

// tslint:disable-next-line no-let
let versionNumber = 0;
const getVersion = () => {
  const current = versionNumber;
  versionNumber += 1;

  return `${current}`;
};

const createLanguageService = (
  fs: PouchDBFileSystem,
  fileNamesIn: ReadonlyArray<string>,
  compilerOptions: ts.CompilerOptions,
  isSmartContract: boolean,
  tmpFS: Map<string, string>,
): ts.LanguageService => {
  const versions = new Map<string, string>();
  fs.changes$
    .pipe(
      map((change) => {
        versions.set(change.id, `${change.seq}`);
      }),
    )
    .subscribe();

  const fileNames = isSmartContract
    ? fileNamesIn.concat([getSmartContractPath('global.d.ts'), getSmartContractPath('index.d.ts')])
    : fileNamesIn;

  const host: ts.LanguageServiceHost = {
    ...createFSHost(fs),
    getNewLine: () => '\n',
    useCaseSensitiveFileNames: () => true,
    getScriptFileNames: () => [...fileNames],
    getCurrentDirectory: () => '/',
    getDefaultLibFileName: (opts: ts.CompilerOptions) => {
      const result = ts.getDefaultLibFilePath(opts);

      return `/node_modules/typescript/lib/${result.slice(2)}`;
    },
    getCompilationSettings: (): ts.CompilerOptions => compilerOptions,
    getScriptVersion: (fileNameIn: string): string => {
      const fileName = normalizePath(fileNameIn);
      if (tmpFS.has(fileName)) {
        return getVersion();
      }

      const version = versions.get(fileName);

      return version === undefined ? '-1' : version;
    },
    getScriptSnapshot: (fileNameIn: string): ts.IScriptSnapshot | undefined => {
      try {
        const fileName = normalizePath(fileNameIn);

        let textIn = tmpFS.get(fileName);
        if (textIn === undefined) {
          textIn = fs.readFileSync(fileName);
        }

        const text = textIn;

        return {
          getText: (start, end) => text.substring(start, end),
          getLength: () => text.length,
          getChangeRange: () => undefined,
        };
      } catch {
        return undefined;
      }
    },
    getScriptKind: (fileName: string): ts.ScriptKind => {
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
          return compilerOptions.allowJs ? ts.ScriptKind.JS : ts.ScriptKind.TS;
      }
    },
  };

  return ts.createLanguageService(host);
};

const clearFiles = (diagnostics: ReadonlyArray<ts.Diagnostic>) => {
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
};

const preferences = { includeCompletionsForModuleExports: true, includeCompletionsWithInsertText: true };
const defaultFormatOptions: ts.FormatCodeSettings = {
  convertTabsToSpaces: true,
  tabSize: 2,
  indentSize: 2,
  indentStyle: ts.IndentStyle.Smart,
  newLineCharacter: '\n',
  insertSpaceAfterCommaDelimiter: true,
  insertSpaceAfterSemicolonInForStatements: true,
  insertSpaceBeforeAndAfterBinaryOperators: true,
  insertSpaceAfterKeywordsInControlFlowStatements: true,
  insertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
  insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
  insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
  insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
  placeOpenBraceOnNewLineForControlBlocks: false,
  placeOpenBraceOnNewLineForFunctions: false,
};

const TRIGGER_CHARACTERS = new Set(['.', '"', "'", '`', '/', '@', '<']);

export class AsyncLanguageService {
  private readonly fs: Promise<PouchDBFileSystem>;
  private readonly tmpFS: Map<string, string>;
  private readonly languageService: Promise<ts.LanguageService>;
  private readonly isSmartContract: boolean;

  public constructor({ id, endpoint, isSmartContract, compilerOptions, fileNames }: Options) {
    this.fs = createFileSystem(id, endpoint);
    this.tmpFS = new Map();
    this.languageService = this.fs.then((fs) =>
      createLanguageService(fs, fileNames, compilerOptions, isSmartContract, this.tmpFS),
    );
    this.isSmartContract = isSmartContract;
  }

  public readonly getSyntacticDiagnostics = (
    fileName: string,
    files: { readonly [key: string]: string },
  ): Promise<ReadonlyArray<ts.Diagnostic>> =>
    this.languageService.then((languageService) =>
      this.withTmpFS(files, () => {
        const diagnostics = languageService.getSyntacticDiagnostics(fileName);
        clearFiles(diagnostics);

        return diagnostics;
      }),
    );

  public readonly getSemanticDiagnostics = (
    fileName: string,
    files: { readonly [key: string]: string },
  ): Promise<ReadonlyArray<ts.Diagnostic>> =>
    Promise.all([this.fs, this.languageService]).then(([fs, languageService]) =>
      this.withTmpFS(files, () => {
        const diagnostics = this.isSmartContract
          ? getSemanticDiagnostics(fileName, languageService, createCompilerHost({ fs }))
          : languageService.getSemanticDiagnostics(fileName);
        clearFiles(diagnostics);

        return diagnostics;
      }),
    );

  public readonly getCompilerOptionsDiagnostics = (_fileName: string): Promise<ReadonlyArray<ts.Diagnostic>> =>
    this.languageService.then((languageService) => {
      const diagnostics = languageService.getCompilerOptionsDiagnostics();
      clearFiles(diagnostics);

      return diagnostics;
    });

  public readonly getCompletionsAtPosition = (
    fileName: string,
    position: number,
    triggerCharacterIn: string | undefined,
    files: { readonly [key: string]: string },
  ): Promise<ts.CompletionInfo | undefined> =>
    this.languageService.then((languageService) =>
      this.withTmpFS(files, () => {
        let triggerCharacter: ts.CompletionsTriggerCharacter | undefined;
        if (triggerCharacterIn !== undefined && TRIGGER_CHARACTERS.has(triggerCharacterIn)) {
          triggerCharacter = triggerCharacterIn as ts.CompletionsTriggerCharacter;
        }

        return languageService.getCompletionsAtPosition(fileName, position, { ...preferences, triggerCharacter });
      }),
    );

  public readonly getCompletionEntryDetails = (
    fileName: string,
    position: number,
    entry: string,
    formatOptions: ts.FormatCodeOptions | ts.FormatCodeSettings = defaultFormatOptions,
    source?: string,
  ): Promise<ts.CompletionEntryDetails | undefined> =>
    this.languageService.then((languageService) =>
      languageService.getCompletionEntryDetails(fileName, position, entry, formatOptions, source, preferences),
    );

  public readonly getCodeFixesAtPosition = (
    fileName: string,
    start: number,
    end: number,
    errorCodes: ReadonlyArray<number>,
    files: { readonly [key: string]: string },
  ): Promise<ReadonlyArray<ts.CodeFixAction>> =>
    this.languageService.then((languageService) =>
      this.withTmpFS(files, () =>
        languageService.getCodeFixesAtPosition(fileName, start, end, errorCodes, defaultFormatOptions, preferences),
      ),
    );

  public readonly getSignatureHelpItems = (
    fileName: string,
    position: number,
    files: { readonly [key: string]: string },
  ): Promise<ts.SignatureHelpItems | undefined> =>
    this.languageService.then((languageService) =>
      this.withTmpFS(files, () => languageService.getSignatureHelpItems(fileName, position, undefined)),
    );

  public readonly getQuickInfoAtPosition = (fileName: string, position: number): Promise<ts.QuickInfo | undefined> =>
    this.languageService.then((languageService) => languageService.getQuickInfoAtPosition(fileName, position));

  public readonly getOccurrencesAtPosition = (
    fileName: string,
    position: number,
  ): Promise<ReadonlyArray<ts.ReferenceEntry> | undefined> =>
    // tslint:disable-next-line deprecation
    this.languageService.then((languageService) => languageService.getOccurrencesAtPosition(fileName, position));

  public readonly getDefinitionAtPosition = (
    fileName: string,
    position: number,
  ): Promise<ReadonlyArray<ts.DefinitionInfo> | undefined> =>
    this.languageService.then((languageService) => languageService.getDefinitionAtPosition(fileName, position));

  public readonly getReferencesAtPosition = (
    fileName: string,
    position: number,
  ): Promise<ReadonlyArray<ts.ReferenceEntry> | undefined> =>
    this.languageService.then((languageService) => languageService.getReferencesAtPosition(fileName, position));

  public readonly getNavigationBarItems = (fileName: string): Promise<ReadonlyArray<ts.NavigationBarItem>> =>
    this.languageService.then((languageService) => languageService.getNavigationBarItems(fileName));

  public readonly getFormattingEditsForDocument = (
    fileName: string,
    options: ts.FormatCodeOptions,
  ): Promise<ReadonlyArray<ts.TextChange>> =>
    this.languageService.then((languageService) => languageService.getFormattingEditsForDocument(fileName, options));

  public readonly getFormattingEditsForRange = (
    fileName: string,
    start: number,
    end: number,
    options: ts.FormatCodeOptions,
  ): Promise<ReadonlyArray<ts.TextChange>> =>
    this.languageService.then((languageService) =>
      languageService.getFormattingEditsForRange(fileName, start, end, options),
    );

  public readonly getFormattingEditsAfterKeystroke = (
    fileName: string,
    postion: number,
    ch: string,
    options: ts.FormatCodeOptions,
  ): Promise<ReadonlyArray<ts.TextChange>> =>
    this.languageService.then((languageService) =>
      languageService.getFormattingEditsAfterKeystroke(fileName, postion, ch, options),
    );

  public readonly getEmitOutput = (fileName: string): Promise<ts.EmitOutput> =>
    this.languageService.then((languageService) => languageService.getEmitOutput(fileName));

  private withTmpFS<T>(files: { readonly [key: string]: string }, func: () => T): T {
    this.tmpFS.clear();
    Object.entries(files).forEach(([path, content]) => {
      this.tmpFS.set(path, content);
    });
    try {
      return func();
    } finally {
      this.tmpFS.clear();
    }
  }
}

export interface ICreateData {
  readonly compilerOptions: ts.CompilerOptions;
  readonly isSmartContract: boolean;
  readonly fileSystemID: string;
}
