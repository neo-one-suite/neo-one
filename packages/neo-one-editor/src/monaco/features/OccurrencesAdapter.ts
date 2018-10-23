/// <reference types="monaco-editor/monaco" />
import { map, switchMap } from 'rxjs/operators';
import { Adapter } from './Adapter';
import { positionToOffset, textSpanToRange } from './utils';

export class OccurrencesAdapter extends Adapter implements monaco.languages.DocumentHighlightProvider {
  public provideDocumentHighlights(
    model: monaco.editor.IReadOnlyModel,
    position: monaco.Position,
    token: monaco.CancellationToken,
    // tslint:disable-next-line readonly-array
  ): monaco.Thenable<monaco.languages.DocumentHighlight[]> {
    const resource = model.uri;

    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(
          async (worker) =>
            model.isDisposed()
              ? undefined
              : worker.getOccurrencesAtPosition(resource.path, positionToOffset(model, position)),
        ),
        map((entries) => {
          if (!entries || model.isDisposed()) {
            return [];
          }

          return entries.map((entry) => ({
            range: textSpanToRange(model, entry.textSpan),
            kind: entry.isWriteAccess
              ? monaco.languages.DocumentHighlightKind.Write
              : monaco.languages.DocumentHighlightKind.Text,
          }));
        }),
      ),
    );
  }
}
