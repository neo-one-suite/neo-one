import { utils } from '@neo-one/utils';
import _ from 'lodash';
import { merge, Observable } from 'rxjs';
import { debounceTime, filter, map, switchMap } from 'rxjs/operators';
import ts from 'typescript';
import { AsyncLanguageService } from '../AsyncLanguageService';
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
  diag: ts.Diagnostic,
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
    message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
  };

  return { source: diag.source === undefined ? 'ts' : diag.source, data };
};

export const wireDiagnostics = (manager: MonacoWorkerManager, languageID: string) => {
  const sources = new Set<string>();

  const handleDiagnostics = (diags: ReadonlyArray<{ file: string; diagnostics: ReadonlyArray<ts.Diagnostic> }>) => {
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
    source$: Observable<ReadonlyArray<{ file: string; diagnostics: ReadonlyArray<ts.Diagnostic> }>>,
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

  const subscription = manager.openFiles$
    .pipe(
      switchMap((openFiles) => {
        const openFilesSet = new Set(openFiles);

        return merge(
          manager.fileChanged$.pipe(
            filter((file) => openFilesSet.has(file)),
            switchMap(async (file) => getDiagnostics([file])),
            mapDiagnostics,
          ),
          manager.fileChanged$.pipe(
            filter((file) => !openFilesSet.has(file)),
            debounceTime(750),
            switchMap(async () => getDiagnostics(openFiles)),
            mapDiagnostics,
          ),
        );
      }),
    )
    .subscribe();

  manager.manager.add({
    dispose: () => {
      subscription.unsubscribe();
    },
  });
  manager.manager.add(
    monaco.editor.onDidCreateModel((model) => {
      Promise.resolve()
        .then(async () => {
          const file = model.uri.path;
          // monaco creates dummy models on editor creation with invalid paths, just ignore them.
          if (model.uri.scheme !== 'inmemory' && model.getModeId() === languageID) {
            const diagnostics = await getDiagnostics([file]);
            handleDiagnostics(diagnostics);
          }
        })
        .catch((error) => {
          // tslint:disable-next-line no-console
          console.error(error);
        });
    }),
  );
};
