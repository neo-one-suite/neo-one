/// <reference types="monaco-editor/monaco" />
// tslint:disable no-array-mutation
import { map, switchMap } from 'rxjs/operators';
import { Adapter } from './Adapter';
import { positionToOffset, textSpanToRange } from './utils';

export class DefinitionAdapter extends Adapter implements monaco.languages.DefinitionProvider {
  public provideDefinition(
    model: monaco.editor.IReadOnlyModel,
    position: monaco.Position,
    token: monaco.CancellationToken,
  ): monaco.Thenable<monaco.languages.Definition> {
    const resource = model.uri;

    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(async (worker) =>
          model.isDisposed() ? [] : worker.getDefinitionAtPosition(resource.path, positionToOffset(model, position)),
        ),
        map((entries) => {
          if (!entries || model.isDisposed()) {
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
