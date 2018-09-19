// tslint:disable promise-function-async
/// <reference types="monaco-editor-core/monaco" />
import ts from 'typescript';
import * as tsMode from './tsMode';
import { TypeScriptWorker } from './tsWorker';
import Emitter = monaco.Emitter;
import IEvent = monaco.IEvent;
import IDisposable = monaco.IDisposable;

export interface DiagnosticsOptions {
  readonly noSemanticValidation?: boolean;
  readonly noSyntaxValidation?: boolean;
}

export interface LanguageServiceDefaults {
  /**
   * Add an additional source file to the language service. Use this
   * for typescript (definition) files that won't be loaded as editor
   * document, like `jquery.d.ts`.
   *
   * @param content The file content
   * @param filePath An optional file path
   * @returns A disposabled which will remove the file from the
   * language service upon disposal.
   */
  readonly addExtraLib: (content: string, filePath?: string) => IDisposable;

  /**
   * Set TypeScript compiler options.
   */
  readonly setCompilerOptions: (options: ts.CompilerOptions) => void;

  /**
   * Configure whether syntactic and/or semantic validation should
   * be performed
   */
  readonly setDiagnosticsOptions: (options: DiagnosticsOptions) => void;

  /**
   * Configure when the worker shuts down. By default that is 2mins.
   *
   * @param value The maximum idle time in milliseconds. Values less than one
   * mean never shut down.
   */
  readonly setMaximumWorkerIdleTime: (value: number) => void;

  /**
   * Configure if all existing models should be eagerly sync'd
   * to the worker on start or restart.
   */
  readonly setEagerModelSync: (value: boolean) => void;
}

// tslint:disable-next-line export-name
export class LanguageServiceDefaultsImpl implements LanguageServiceDefaults {
  private readonly onDidChangeInternal = new Emitter<LanguageServiceDefaults>();
  // tslint:disable-next-line readonly-keyword
  private readonly mutableExtraLibs: { [path: string]: string };
  private mutableWorkerMaxIdleTime: number;
  private mutableEagerModelSync = false;
  private mutableCompilerOptions!: ts.CompilerOptions;
  private mutableDiagnosticOptions!: DiagnosticsOptions;
  private mutableIsSmartContract: boolean;

  public constructor(
    compilerOptions: ts.CompilerOptions,
    diagnosticsOptions: DiagnosticsOptions,
    isSmartContract = false,
  ) {
    // tslint:disable-next-line no-null-keyword
    this.mutableExtraLibs = Object.create(null);
    this.mutableWorkerMaxIdleTime = 2 * 60 * 1000;
    this.setCompilerOptions(compilerOptions);
    this.setDiagnosticsOptions(diagnosticsOptions);
    this.mutableIsSmartContract = isSmartContract;
  }

  public get onDidChange(): IEvent<LanguageServiceDefaults> {
    return this.onDidChangeInternal.event;
  }

  public getExtraLibs(): { readonly [path: string]: string } {
    return Object.freeze({ ...this.mutableExtraLibs });
  }

  public addExtraLib(content: string, filePath = `ts:extralib-${Date.now()}`): IDisposable {
    if ((this.mutableExtraLibs[filePath] as string | undefined) !== undefined) {
      throw new Error(`${filePath} already a extra lib`);
    }

    this.mutableExtraLibs[filePath] = content;
    this.onDidChangeInternal.fire(this);

    return {
      dispose: () => {
        if ((this.mutableExtraLibs[filePath] as string | undefined) !== undefined) {
          // tslint:disable-next-line no-dynamic-delete
          delete this.mutableExtraLibs[filePath];
          this.onDidChangeInternal.fire(this);
        }
      },
    };
  }

  public getCompilerOptions(): ts.CompilerOptions {
    return this.mutableCompilerOptions;
  }

  public setCompilerOptions(options: ts.CompilerOptions = {}): void {
    this.mutableCompilerOptions = options;
    this.onDidChangeInternal.fire(this);
  }

  public getDiagnosticsOptions(): DiagnosticsOptions {
    return this.mutableDiagnosticOptions;
  }

  public setDiagnosticsOptions(options: DiagnosticsOptions = {}): void {
    this.mutableDiagnosticOptions = options;
    this.onDidChangeInternal.fire(this);
  }

  public setMaximumWorkerIdleTime(value: number): void {
    // doesn't fire an event since no worker restart is required here
    this.mutableWorkerMaxIdleTime = value;
  }

  public getWorkerMaxIdleTime() {
    return this.mutableWorkerMaxIdleTime;
  }

  public setEagerModelSync(value: boolean) {
    // doesn't fire an event since no
    // worker restart is required here
    this.mutableEagerModelSync = value;
  }

  public getEagerModelSync() {
    return this.mutableEagerModelSync;
  }

  public setIsSmartContract(isSmartContract: boolean) {
    this.mutableIsSmartContract = isSmartContract;
  }

  public isSmartContract() {
    return this.mutableIsSmartContract;
  }
}

// tslint:disable-next-line readonly-keyword
const mutableLanguageDefaults: { [name: string]: LanguageServiceDefaultsImpl } = {};

mutableLanguageDefaults.typescript = new LanguageServiceDefaultsImpl(
  { allowNonTsExtensions: true, target: ts.ScriptTarget.ESNext },
  { noSemanticValidation: false, noSyntaxValidation: false },
);

mutableLanguageDefaults['typescript-smart-contract'] = new LanguageServiceDefaultsImpl(
  { allowNonTsExtensions: true, target: ts.ScriptTarget.ESNext },
  { noSemanticValidation: false, noSyntaxValidation: false },
  true,
);

mutableLanguageDefaults.javascript = new LanguageServiceDefaultsImpl(
  { allowNonTsExtensions: true, allowJs: true, target: ts.ScriptTarget.ESNext },
  { noSemanticValidation: true, noSyntaxValidation: false },
);

// tslint:disable-next-line readonly-array
type GetWorker = monaco.Promise<(first: monaco.Uri, ...more: monaco.Uri[]) => monaco.Promise<TypeScriptWorker>>;

function getTypeScriptWorker(): GetWorker {
  return getLanguageWorker('typescript');
}

function getJavaScriptWorker(): GetWorker {
  return getLanguageWorker('javascript');
}

function getLanguageWorker(languageName: string): GetWorker {
  return getMode().then((mode) => mode.getNamedLanguageWorker(languageName));
}

function getLanguageDefaults(languageName: string): LanguageServiceDefaultsImpl {
  return mutableLanguageDefaults[languageName];
}

function setupNamedLanguage(
  languageDefinition: monaco.languages.ILanguageExtensionPoint,
  isTypescript: boolean,
  isSmartContract = false,
): void {
  monaco.languages.register(languageDefinition);
  mutableLanguageDefaults[languageDefinition.id] = isTypescript
    ? isSmartContract
      ? mutableLanguageDefaults['typescript-smart-contract']
      : mutableLanguageDefaults.typescript
    : mutableLanguageDefaults.javascript;
  monaco.languages.onLanguage(languageDefinition.id, () =>
    getMode().then((mode) =>
      mode.setupNamedLanguage(languageDefinition.id, mutableLanguageDefaults[languageDefinition.id]),
    ),
  );
}

function createAPI() {
  return {
    ModuleKind: ts.ModuleKind,
    JsxEmit: ts.JsxEmit,
    NewLineKind: ts.NewLineKind,
    ScriptTarget: ts.ScriptTarget,
    ModuleResolutionKind: ts.ModuleResolutionKind,
    typescriptDefaults: getLanguageDefaults('typescript'),
    javascriptDefaults: getLanguageDefaults('javascript'),
    getLanguageDefaults,
    getTypeScriptWorker,
    getJavaScriptWorker,
    getLanguageWorker,
    setupNamedLanguage,
  };
}
// @ts-ignore
monaco.languages.typescript = createAPI(); // tslint:disable-line no-object-mutation

function getMode(): monaco.Promise<typeof tsMode> {
  return monaco.Promise.wrap(import('./tsMode'));
}

setupNamedLanguage(
  {
    id: 'typescript',
    extensions: ['.ts', '.tsx'],
    aliases: ['TypeScript', 'ts', 'typescript'],
    mimetypes: ['text/typescript'],
  },
  true,
);

getLanguageDefaults('typescript').setEagerModelSync(true);
getLanguageDefaults('typescript').setCompilerOptions({
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,

  lib: ['esnext', 'dom'],

  pretty: true,

  noEmit: true,
  declaration: false,

  allowSyntheticDefaultImports: true,
  resolveJsonModule: false,
  experimentalDecorators: true,
  jsx: ts.JsxEmit.React,

  alwaysStrict: true,
  strict: true,
  skipLibCheck: true,
  noUnusedLocals: true,
  noImplicitReturns: true,
  allowUnusedLabels: false,
  noUnusedParameters: false,
  allowUnreachableCode: false,
  noFallthroughCasesInSwitch: true,
  forceConsistentCasingInFileNames: true,
});

// tslint:disable-next-line no-object-mutation no-any
(global as any).MonacoEnvironment = {
  getWorkerUrl(_moduleId: string, label: string) {
    let MonacoWorker;

    switch (label) {
      case 'typescript-smart-contract':
      case 'typescript':
      case 'javascript':
        MonacoWorker = 'ts.worker.js';
        break;
      default:
        MonacoWorker = 'editor.worker.js';
    }

    return MonacoWorker;
  },
};

setupNamedLanguage(
  {
    id: 'typescript-smart-contract',
    extensions: ['.ts', '.tsx'],
    aliases: ['TypeScript', 'ts', 'typescript'],
    mimetypes: ['text/typescript'],
  },
  true,
  true,
);

getLanguageDefaults('typescript-smart-contract').setEagerModelSync(true);
getLanguageDefaults('typescript-smart-contract').setCompilerOptions({
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,

  noLib: true,
  typeRoots: [],

  pretty: true,

  noEmit: true,
  declaration: false,

  allowSyntheticDefaultImports: true,
  resolveJsonModule: false,
  experimentalDecorators: true,

  alwaysStrict: true,
  strict: true,
  skipLibCheck: false,
  noUnusedLocals: true,
  noImplicitReturns: true,
  allowUnusedLabels: false,
  noUnusedParameters: false,
  allowUnreachableCode: false,
  noFallthroughCasesInSwitch: true,
  forceConsistentCasingInFileNames: true,
});

setupNamedLanguage(
  {
    id: 'javascript',
    extensions: ['.js', '.es6', '.jsx'],
    firstLine: '^#!.*\\bnode',
    filenames: ['jakefile'],
    aliases: ['JavaScript', 'javascript', 'js'],
    mimetypes: ['text/javascript'],
  },
  false,
);
