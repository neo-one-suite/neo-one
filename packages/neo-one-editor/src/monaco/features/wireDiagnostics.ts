/// <reference types="monaco-editor/monaco" />
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import { merge, Observable } from 'rxjs';
import { concatMap, debounceTime, filter, map, switchMap } from 'rxjs/operators';
import ts from 'typescript';
import { AsyncLanguageService, FlattenedDiagnostic } from '../AsyncLanguageService';
import { MonacoWorkerManager } from '../types';
import { getModel, offsetToPosition } from './utils';

const convertDiagnosticCategory = (category: ts.DiagnosticCategory) => {
  switch (category) {
    case ts.DiagnosticCategory.Warning:
      return monaco.MarkerSeverity.Warning;
    case ts.DiagnosticCategory.Suggestion:
      return monaco.MarkerSeverity.Hint;
    case ts.DiagnosticCategory.Message:
      return monaco.MarkerSeverity.Info;
    default:
      return monaco.MarkerSeverity.Error;
  }
};

const convertDiagnostics = (
  model: monaco.editor.ITextModel,
  diag: FlattenedDiagnostic,
): { readonly source: string; readonly data: monaco.editor.IMarkerData } | undefined => {
  const { start, length } = diag;
  if (start === undefined || length === undefined) {
    return undefined;
  }

  const { lineNumber: startLineNumber, column: startColumn } = offsetToPosition(model, start);
  const { lineNumber: endLineNumber, column: endColumn } = offsetToPosition(model, start + length);

  const data = {
    code: `${diag.code}`,
    severity: convertDiagnosticCategory(diag.category),
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
    message: diag.message,
  };

  return { source: diag.source === undefined ? 'ts' : diag.source, data };
};

export const wireDiagnostics = (manager: MonacoWorkerManager, languageID: string) => {
  const sources = new Set<string>();

  const handleDiagnostics = (
    diags: ReadonlyArray<{ file: string; diagnostics: ReadonlyArray<FlattenedDiagnostic> }>,
  ) => {
    diags.forEach(({ file, diagnostics }) => {
      const model = getModel(file);
      if (model) {
        const markers = diagnostics.map((diagnostic) => convertDiagnostics(model, diagnostic)).filter(utils.notNull);
        const seenSources = new Set<string>();
        Object.entries(_.groupBy(markers, ({ source }) => source)).forEach(([source, sourceMarkers]) => {
          sources.add(source);
          seenSources.add(source);
          monaco.editor.setModelMarkers(model, source, sourceMarkers.map(({ data }) => data));
        });

        sources.forEach((source) => {
          if (!seenSources.has(source)) {
            monaco.editor.setModelMarkers(model, source, []);
          }
        });
      }
    });
  };

  const mapDiagnostics = (
    source$: Observable<ReadonlyArray<{ file: string; diagnostics: ReadonlyArray<FlattenedDiagnostic> }>>,
  ) => source$.pipe(map(handleDiagnostics));

  const getDiagnosticsForFile = async (
    worker: AsyncLanguageService,
    file: string,
    files: { [key: string]: string },
  ) => {
    const [syntacticDiagnostics, semanticDiagnostics] = await Promise.all([
      worker.getSyntacticDiagnostics(file, files),
      worker.getSemanticDiagnostics(file, files),
    ]);

    const diagnostics = syntacticDiagnostics.concat(semanticDiagnostics);

    return { file, diagnostics };
  };

  const getDiagnostics = async (files: ReadonlyArray<string>) => {
    const mutableFiles: { [key: string]: string } = {};
    // tslint:disable-next-line no-loop-statement
    for (const file of files) {
      mutableFiles[file] = manager.fs.readFileSync(file);
    }

    return manager.manager.withInstance(async (worker) =>
      Promise.all(files.map(async (file) => getDiagnosticsForFile(worker, file, mutableFiles))),
    );
  };

  const newFile$ = new Observable<ReadonlyArray<string>>((observer) => {
    const disposable = monaco.editor.onDidCreateModel((model) => {
      if (!model.isDisposed() && model.uri.scheme !== 'inmemory' && model.getModeId() === languageID) {
        observer.next([model.uri.path]);
      }
    });

    return () => disposable.dispose();
  });

  const subscription = manager.openFiles$
    .pipe(
      switchMap((openFiles) => {
        const openFilesSet = new Set(openFiles);

        return merge(
          manager.fileChanged$.pipe(
            filter((file) => openFilesSet.has(file)),
            map((file) => [file]),
          ),
          manager.fileChanged$.pipe(
            filter((file) => !openFilesSet.has(file)),
            debounceTime(750),
            map(() => openFiles),
          ),
          newFile$,
        ).pipe(
          concatMap(async (files) => getDiagnostics(files)),
          mapDiagnostics,
        );
      }),
    )
    .subscribe();

  manager.manager.add({
    dispose: () => {
      subscription.unsubscribe();
    },
  });
};
