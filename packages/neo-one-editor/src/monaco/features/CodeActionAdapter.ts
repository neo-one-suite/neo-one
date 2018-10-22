import { utils } from '@neo-one/utils';
import { map, switchMap } from 'rxjs/operators';
import { Adapter } from './Adapter';
import { convertCodeFixAction, positionToOffset } from './utils';

export class CodeActionAdapter extends Adapter implements monaco.languages.CodeActionProvider {
  public provideCodeActions(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    context: monaco.languages.CodeActionContext,
    token: monaco.CancellationToken, // tslint:disable readonly-array
  ):
    | Array<monaco.languages.Command | monaco.languages.CodeAction>
    | monaco.Thenable<Array<monaco.languages.Command | monaco.languages.CodeAction>> {
    const resource = model.uri;
    const errorCodes = context.markers
      .map((marker) => marker.code)
      .filter(utils.notNull)
      .map(Number)
      .filter((value) => !Number.isNaN(value));

    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(async (worker) =>
          worker.getCodeFixesAtPosition(
            resource.path,
            positionToOffset(model, range.getStartPosition()),
            positionToOffset(model, range.getEndPosition()),
            errorCodes,
            {
              [resource.path]: model.getValue(),
            },
          ),
        ),
        map((fixes) => fixes.map((fix) => convertCodeFixAction(model, fix))),
      ),
    );
  }
}
