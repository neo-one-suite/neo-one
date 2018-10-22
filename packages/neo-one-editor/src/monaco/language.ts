// tslint:disable promise-function-async no-submodule-imports no-implicit-dependencies no-import-side-effect
// @ts-ignore
import * as fake from 'monaco-editor/esm/vs/language/html/monaco.contribution';

import { PouchDBFileSystem } from '@neo-one/local-browser';
import { FileSystemManager } from '@neo-one/local-browser-worker';
import { WorkerManager } from '@neo-one/worker';
// @ts-ignore
import editorWorkerURL from 'file-loader?name=[hash].[name].[ext]!../../../../dist/workers/editor.worker.js';
// @ts-ignore
import htmlWorkerURL from 'file-loader?name=[hash].[name].[ext]!../../../../dist/workers/html.worker.js';
// @ts-ignore
import * as javascriptModule from 'monaco-editor/esm/vs/basic-languages/javascript/javascript';
import { Observable, Subject } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import ts from 'typescript';
import { getFileType } from '../utils';
import { AsyncLanguageService } from './AsyncLanguageService';
import { configureGrammar } from './configureGrammar';
import {
  CodeActionAdapter,
  DefinitionAdapter,
  FormatAdapter,
  FormatOnTypeAdapter,
  OccurrencesAdapter,
  OutlineAdapter,
  QuickInfoAdapter,
  ReferenceAdapter,
  SignatureHelpAdapter,
  SuggestAdapter,
  wireDiagnostics,
} from './features';
import { MonacoWorkerManager } from './types';
import * as typescriptModule from './typescript';
import { TypeScriptWorker } from './TypeScriptWorker';

// tslint:disable-next-line no-object-mutation no-any
(global as any).MonacoEnvironment = {
  getWorker(_moduleId: string, label: string) {
    let MonacoWorker;

    // tslint:disable-next-line:prefer-conditional-expression
    if (label.endsWith('html') && fake) {
      MonacoWorker = new Worker(htmlWorkerURL);
    } else {
      MonacoWorker = new Worker(editorWorkerURL);
    }

    return MonacoWorker;
  },
};

export enum LanguageID {
  Contract = 'contract-internal',
  TypeScript = 'typescript-internal',
  JavaScript = 'javascript-internal',
}

export async function setupLanguages(
  fsManager: FileSystemManager,
  fs: PouchDBFileSystem,
  id: string,
  openFiles$: Observable<ReadonlyArray<string>>,
): Promise<{ readonly dispose: () => void }> {
  const createMonacoWorkerManager = async (
    compilerOptions: ts.CompilerOptions,
    isSmartContract: boolean,
    isLanguageFile: (file: string) => boolean,
  ): Promise<MonacoWorkerManager> => {
    const filteredFiles$ = openFiles$.pipe(map((files) => files.filter(isLanguageFile)));
    let fileNames = await filteredFiles$.pipe(take(1)).toPromise();
    const restart$ = new Subject<void>();
    // tslint:disable-next-line rxjs-no-ignored-error
    const subscription = filteredFiles$.subscribe((nextInitialFileNames) => {
      fileNames = nextInitialFileNames;
      restart$.next();
    });

    const manager = new WorkerManager<typeof AsyncLanguageService>(
      TypeScriptWorker,
      () => {
        const disposableEndpoint = fsManager.getEndpoint();

        const options = {
          compilerOptions,
          isSmartContract,
          id,
          endpoint: disposableEndpoint.endpoint,
          fileNames,
        };

        return { options, disposables: [disposableEndpoint] };
      },
      30 * 1000,
      restart$,
    );

    manager.add({
      dispose: () => {
        subscription.unsubscribe();
      },
    });

    const fileChanged$ = fs.changes$.pipe(
      map((change) => change.id),
      filter(isLanguageFile),
    );

    return {
      manager,
      fs,
      openFiles$: filteredFiles$,
      fileChanged$,
      isLanguageFile,
    };
  };

  const [javascriptManager, typescriptManager, contractManager] = await Promise.all([
    createMonacoWorkerManager(
      { allowNonTsExtensions: true, allowJs: true, target: ts.ScriptTarget.ESNext },
      false,
      (file) => getFileType(file) === 'javascript',
    ),
    createMonacoWorkerManager(
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
      false,
      (file) => getFileType(file) === 'typescript',
    ),
    createMonacoWorkerManager(
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
      true,
      (file) => getFileType(file) === 'contract',
    ),
  ]);

  setupLanguage(LanguageID.JavaScript, javascriptManager, false);
  setupLanguage(LanguageID.TypeScript, typescriptManager, true);
  setupLanguage(LanguageID.Contract, contractManager, true);

  return {
    dispose: () => {
      javascriptManager.manager.dispose();
      typescriptManager.manager.dispose();
      contractManager.manager.dispose();
    },
  };
}

const registeredLanguages = new Set<string>();

function setupLanguage(languageID: string, manager: MonacoWorkerManager, isTypeScript: boolean) {
  if (!registeredLanguages.has(languageID)) {
    monaco.languages.register({ id: languageID });
    const mod = isTypeScript ? typescriptModule : javascriptModule;
    monaco.languages.setLanguageConfiguration(languageID, mod.conf);
    configureGrammar(languageID).catch((error) => {
      // tslint:disable-next-line no-console
      console.error(error);
    });
    registeredLanguages.add(languageID);
  }

  const referenceAdapter = new ReferenceAdapter(manager.manager.instance$, manager.fs, languageID);
  manager.manager.add(referenceAdapter);
  manager.manager.add(monaco.languages.registerReferenceProvider(languageID, referenceAdapter));

  // registerRenameProvider
  const signatureAdapter = new SignatureHelpAdapter(manager.manager.instance$, manager.fs, languageID);
  manager.manager.add(signatureAdapter);
  manager.manager.add(monaco.languages.registerSignatureHelpProvider(languageID, signatureAdapter));

  const quickInfoAdapter = new QuickInfoAdapter(manager.manager.instance$, manager.fs, languageID);
  manager.manager.add(quickInfoAdapter);
  manager.manager.add(monaco.languages.registerHoverProvider(languageID, quickInfoAdapter));

  const outlineAdapter = new OutlineAdapter(manager.manager.instance$, manager.fs, languageID);
  manager.manager.add(outlineAdapter);
  manager.manager.add(monaco.languages.registerDocumentSymbolProvider(languageID, outlineAdapter));

  const occurrencesAdapter = new OccurrencesAdapter(manager.manager.instance$, manager.fs, languageID);
  manager.manager.add(occurrencesAdapter);
  manager.manager.add(monaco.languages.registerDocumentHighlightProvider(languageID, occurrencesAdapter));

  const definitionAdapter = new DefinitionAdapter(manager.manager.instance$, manager.fs, languageID);
  manager.manager.add(definitionAdapter);
  manager.manager.add(monaco.languages.registerDefinitionProvider(languageID, definitionAdapter));
  // registerImplementationProvider
  // registerTypeDefinitionProvider
  // registerCodeLensProvider
  const codeActionAdapter = new CodeActionAdapter(manager.manager.instance$, manager.fs, languageID);
  manager.manager.add(codeActionAdapter);
  manager.manager.add(monaco.languages.registerCodeActionProvider(languageID, codeActionAdapter));
  // registerDocumentFormattingEditProvider
  const formatAdapter = new FormatAdapter(manager.manager.instance$, manager.fs, languageID);
  manager.manager.add(formatAdapter);
  manager.manager.add(monaco.languages.registerDocumentRangeFormattingEditProvider(languageID, formatAdapter));

  const formatOnTypeAdapter = new FormatOnTypeAdapter(manager.manager.instance$, manager.fs, languageID);
  manager.manager.add(formatOnTypeAdapter);
  manager.manager.add(monaco.languages.registerOnTypeFormattingEditProvider(languageID, formatOnTypeAdapter));
  // registerLinkProvider
  const suggestAdapter = new SuggestAdapter(manager.manager.instance$, manager.fs, languageID);
  manager.manager.add(suggestAdapter);
  manager.manager.add(monaco.languages.registerCompletionItemProvider(languageID, suggestAdapter));
  // registerColorProvider
  // registerFoldingRangeProvider
  // tslint:disable-next-line no-unused-expression
  wireDiagnostics(manager, languageID);
}
