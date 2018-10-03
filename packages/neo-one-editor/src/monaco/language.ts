// tslint:disable promise-function-async no-submodule-imports no-implicit-dependencies
import { FileSystem } from '@neo-one/local-browser';
// @ts-ignore
import * as javascriptModule from 'monaco-editor/esm/vs/basic-languages/javascript/javascript';
import ts from 'typescript';
// @ts-ignore
import TSWorker from 'worker-loader!./ts.worker';
// @ts-ignore
import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';
import * as languageFeatures from './languageFeatures';
import { LanguageServiceOptions } from './LanguageServiceOptions';
import { TypeScriptWorker } from './tsWorker';
import * as typescriptModule from './typescript';
import { WorkerManager } from './WorkerManager';

import Promise = monaco.Promise;
import Uri = monaco.Uri;

const CONTRACT_SUFFIX = '-contract';
const TYPESCRIPT_SUFFIX = '-typescript';
const JAVASCRIPT_SUFFIX = '-javascript';

// tslint:disable-next-line no-object-mutation no-any
(global as any).MonacoEnvironment = {
  getWorker(_moduleId: string, label: string) {
    let MonacoWorker;

    // tslint:disable-next-line:prefer-conditional-expression
    if (label.endsWith(CONTRACT_SUFFIX) || label.endsWith(TYPESCRIPT_SUFFIX) || label.endsWith(JAVASCRIPT_SUFFIX)) {
      MonacoWorker = TSWorker();
    } else {
      MonacoWorker = EditorWorker();
    }

    return MonacoWorker;
  },
};

export enum LanguageType {
  Contract,
  TypeScript,
  JavaScript,
}

export function getLanguageID(fileSystemID: string, type: LanguageType) {
  let suffix: string;
  switch (type) {
    case LanguageType.Contract:
      suffix = CONTRACT_SUFFIX;
      break;
    case LanguageType.TypeScript:
      suffix = TYPESCRIPT_SUFFIX;
      break;
    case LanguageType.JavaScript:
      suffix = JAVASCRIPT_SUFFIX;
      break;
    default:
      throw new Error('For TS');
  }

  return `${fileSystemID}${suffix}`;
}

function setupTypeScript(fileSystemID: string, fs: FileSystem) {
  const options = new LanguageServiceOptions(
    {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,

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
    },
    { noSemanticValidation: false, noSyntaxValidation: false },
    fileSystemID,
    fs,
  );
  options.setEagerModelSync(true);

  setupLanguage(getLanguageID(fileSystemID, LanguageType.TypeScript), options, true);
}

function setupContract(fileSystemID: string, fs: FileSystem) {
  const options = new LanguageServiceOptions(
    {
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
    },
    { noSemanticValidation: false, noSyntaxValidation: false },
    fileSystemID,
    fs,
    true,
  );
  options.setEagerModelSync(true);

  setupLanguage(getLanguageID(fileSystemID, LanguageType.Contract), options, true);
}

function setupJavaScript(fileSystemID: string, fs: FileSystem) {
  const options = new LanguageServiceOptions(
    { allowNonTsExtensions: true, allowJs: true, target: ts.ScriptTarget.ESNext },
    { noSemanticValidation: true, noSyntaxValidation: false },
    fileSystemID,
    fs,
  );
  options.setEagerModelSync(true);

  setupLanguage(getLanguageID(fileSystemID, LanguageType.JavaScript), options, false);
}

export function setupLanguages(fileSystemID: string, fs: FileSystem) {
  setupJavaScript(fileSystemID, fs);
  setupTypeScript(fileSystemID, fs);
  setupContract(fileSystemID, fs);
}

// tslint:disable-next-line readonly-keyword
const mutableManagers: { [languageID: string]: WorkerManager } = {};
// tslint:disable-next-line readonly-keyword
const mutableOptions: { [languageID: string]: LanguageServiceOptions } = {};

function setupLanguage(languageID: string, options: LanguageServiceOptions, isTypeScript: boolean) {
  if ((mutableManagers[languageID] as WorkerManager | undefined) !== undefined) {
    return;
  }
  monaco.languages.register({ id: languageID });

  const manager = new WorkerManager(languageID, options);
  mutableManagers[languageID] = manager;
  mutableOptions[languageID] = options;
  const worker = (...uris: Uri[]): Promise<TypeScriptWorker> => manager.getScriptWorker(...uris);

  monaco.languages.registerCompletionItemProvider(languageID, new languageFeatures.SuggestAdapter(worker));
  monaco.languages.registerSignatureHelpProvider(languageID, new languageFeatures.SignatureHelpAdapter(worker));
  monaco.languages.registerHoverProvider(languageID, new languageFeatures.QuickInfoAdapter(worker));
  monaco.languages.registerDocumentHighlightProvider(languageID, new languageFeatures.OccurrencesAdapter(worker));
  monaco.languages.registerDefinitionProvider(languageID, new languageFeatures.DefinitionAdapter(worker));
  monaco.languages.registerReferenceProvider(languageID, new languageFeatures.ReferenceAdapter(worker));
  monaco.languages.registerDocumentSymbolProvider(languageID, new languageFeatures.OutlineAdapter(worker));
  monaco.languages.registerDocumentRangeFormattingEditProvider(languageID, new languageFeatures.FormatAdapter(worker));
  monaco.languages.registerOnTypeFormattingEditProvider(languageID, new languageFeatures.FormatOnTypeAdapter(worker));
  // tslint:disable-next-line no-unused-expression
  new languageFeatures.DiagnostcsAdapter(options, languageID, worker);
  const mod = isTypeScript ? typescriptModule : javascriptModule;
  monaco.languages.setMonarchTokensProvider(languageID, mod.language);
  monaco.languages.setLanguageConfiguration(languageID, mod.conf);
}
