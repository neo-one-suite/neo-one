// tslint:disable:prefer-template
import { map, switchMap } from 'rxjs/operators';
import ts from 'typescript';
import { Adapter } from './Adapter';
import { convertTags, positionToOffset, textSpanToRange, wrapCode } from './utils';

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
        switchMap(async (worker) => worker.getQuickInfoAtPosition(resource.path, positionToOffset(model, position))),
        map((info) => {
          if (!info) {
            return { contents: [] };
          }

          const documentation = ts.displayPartsToString(info.documentation);
          const tags = convertTags(info.tags);
          const contents = ts.displayPartsToString(info.displayParts);

          return {
            range: textSpanToRange(model, info.textSpan),
            contents: [
              {
                value: wrapCode(model.getModeId(), contents) + '\n',
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
