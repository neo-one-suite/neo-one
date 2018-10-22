// tslint:disable no-array-mutation
import { map, switchMap } from 'rxjs/operators';
import { Adapter } from './Adapter';
import { positionToOffset, textSpanToRange } from './utils';

export class ReferenceAdapter extends Adapter implements monaco.languages.ReferenceProvider {
  public provideReferences(
    model: monaco.editor.IReadOnlyModel,
    position: monaco.Position,
    _context: monaco.languages.ReferenceContext,
    token: monaco.CancellationToken,
    // tslint:disable-next-line readonly-array
  ): monaco.Thenable<monaco.languages.Location[]> {
    const resource = model.uri;

    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(async (worker) => worker.getReferencesAtPosition(resource.path, positionToOffset(model, position))),
        map((entries) => {
          if (!entries) {
            return [];
          }

          const result: monaco.languages.Location[] = [];
          // tslint:disable-next-line no-loop-statement
          for (const entry of entries) {
            const otherModel = this.getOrCreateModel(entry.fileName);
            if (otherModel) {
              result.push({
                uri: otherModel.uri,
                range: textSpanToRange(otherModel, entry.textSpan),
              });
            }
          }

          return result;
        }),
      ),
    );
  }
}
