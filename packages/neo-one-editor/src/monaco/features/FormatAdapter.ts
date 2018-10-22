import { map, switchMap } from 'rxjs/operators';
import { Adapter } from './Adapter';
import { convertFormattingOptions, convertTextChange, positionToOffset } from './utils';

export class FormatAdapter extends Adapter implements monaco.languages.DocumentRangeFormattingEditProvider {
  public provideDocumentRangeFormattingEdits(
    model: monaco.editor.IReadOnlyModel,
    range: monaco.Range,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken,
    // tslint:disable-next-line:readonly-array
  ): monaco.Thenable<monaco.editor.ISingleEditOperation[]> {
    const resource = model.uri;

    // @ts-ignore
    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(async (worker) =>
          worker.getFormattingEditsForRange(
            resource.path,
            positionToOffset(model, { lineNumber: range.startLineNumber, column: range.startColumn }),
            positionToOffset(model, { lineNumber: range.endLineNumber, column: range.endColumn }),
            convertFormattingOptions(options),
          ),
        ),
        map((edits) => edits.map((edit) => convertTextChange(model, edit))),
      ),
    );
  }
}
