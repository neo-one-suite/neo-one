// tslint:disable promise-function-async
import * as languageFeatures from './languageFeatures';
import { LanguageServiceDefaultsImpl } from './monaco.contribution';
import { TypeScriptWorker } from './tsWorker';
import { WorkerManager } from './workerManager';

import Promise = monaco.Promise;
import Uri = monaco.Uri;

// tslint:disable-next-line readonly-array
type GetWorker = (first: Uri, ...more: Uri[]) => Promise<TypeScriptWorker>;

// tslint:disable-next-line readonly-keyword
const mutableScriptWorkerMap: { [name: string]: GetWorker } = {};

export function setupNamedLanguage(languageName: string, defaults: LanguageServiceDefaultsImpl): void {
  mutableScriptWorkerMap[`${languageName}Worker`] = setupMode(defaults, languageName);
}

export function getNamedLanguageWorker(languageName: string): Promise<GetWorker> {
  const workerName = `${languageName}Worker`;

  return new monaco.Promise((resolve, reject) => {
    if ((mutableScriptWorkerMap[workerName] as GetWorker | undefined) === undefined) {
      reject(`${languageName} not registered!`);
    } else {
      resolve(mutableScriptWorkerMap[workerName]);
    }
  });
}

function setupMode(defaults: LanguageServiceDefaultsImpl, modeId: string): GetWorker {
  const client = new WorkerManager(modeId, defaults);
  const worker = (first: Uri, ...more: Uri[]): Promise<TypeScriptWorker> =>
    client.getLanguageServiceWorker(...[first].concat(more));

  monaco.languages.registerCompletionItemProvider(modeId, new languageFeatures.SuggestAdapter(worker));
  monaco.languages.registerSignatureHelpProvider(modeId, new languageFeatures.SignatureHelpAdapter(worker));
  monaco.languages.registerHoverProvider(modeId, new languageFeatures.QuickInfoAdapter(worker));
  monaco.languages.registerDocumentHighlightProvider(modeId, new languageFeatures.OccurrencesAdapter(worker));
  monaco.languages.registerDefinitionProvider(modeId, new languageFeatures.DefinitionAdapter(worker));
  monaco.languages.registerReferenceProvider(modeId, new languageFeatures.ReferenceAdapter(worker));
  monaco.languages.registerDocumentSymbolProvider(modeId, new languageFeatures.OutlineAdapter(worker));
  monaco.languages.registerDocumentRangeFormattingEditProvider(modeId, new languageFeatures.FormatAdapter(worker));
  monaco.languages.registerOnTypeFormattingEditProvider(modeId, new languageFeatures.FormatOnTypeAdapter(worker));
  // tslint:disable-next-line no-unused-expression
  new languageFeatures.DiagnostcsAdapter(defaults, modeId, worker);

  return worker;
}
