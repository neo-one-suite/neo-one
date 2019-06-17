/// <reference types="monaco-editor/monaco" />
import { map, switchMap } from 'rxjs/operators';
import ts from 'typescript';
import { Adapter } from './Adapter';
import { convertTextChange, positionToOffset } from './utils';

export class FormatAdapter extends Adapter implements monaco.languages.DocumentRangeFormattingEditProvider {
  public provideDocumentRangeFormattingEdits(
    model: monaco.editor.IReadOnlyModel,
    range: monaco.Range,
    options: monaco.languages.FormattingOptions,
    token: monaco.CancellationToken,
    // tslint:disable-next-line:readonly-array
  ): monaco.Thenable<monaco.languages.TextEdit[]> {
    const resource = model.uri;

    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(
          async (worker): Promise<readonly ts.TextChange[]> =>
            model.isDisposed()
              ? []
              : worker.getFormattingEditsForRange(
                  resource.path,
                  positionToOffset(model, { lineNumber: range.startLineNumber, column: range.startColumn }),
                  positionToOffset(model, { lineNumber: range.endLineNumber, column: range.endColumn }),
                  options,
                ),
        ),
        map((edits) => (model.isDisposed() ? [] : edits.map((edit) => convertTextChange(model, edit)))),
      ),
    );
  }
}
