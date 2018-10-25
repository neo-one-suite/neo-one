/// <reference types="monaco-editor/monaco" />
// tslint:disable:prefer-template
import { map, switchMap } from 'rxjs/operators';
import { Adapter } from './Adapter';
import { positionToOffset, textSpanToRange, wrapCode } from './utils';

export class QuickInfoAdapter extends Adapter implements monaco.languages.HoverProvider {
  public provideHover(
    model: monaco.editor.IReadOnlyModel,
    position: monaco.Position,
    token: monaco.CancellationToken,
  ): monaco.Thenable<monaco.languages.Hover> {
    const resource = model.uri;

    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(
          async (worker) =>
            model.isDisposed()
              ? undefined
              : worker.parseInfoAtPosition(resource.path, positionToOffset(model, position)),
        ),
        map((info) => {
          if (!info || model.isDisposed()) {
            return { contents: [] };
          }
          const documentation = info.documentation === undefined ? '' : info.documentation;
          const tags = info.tags === undefined ? '' : info.tags;

          return {
            range: textSpanToRange(model, info.textSpan),
            contents: [
              {
                value: wrapCode(model.getModeId(), info.contents) + '\n',
              },
              {
                value: documentation + tags,
              },
            ],
          };
        }),
      ),
    );
  }
}
