/// <reference types="monaco-editor/monaco" />
import { switchMap } from 'rxjs/operators';
import { Adapter } from './Adapter';
import { positionToOffset } from './utils';

export class SignatureHelpAdapter extends Adapter implements monaco.languages.SignatureHelpProvider {
  // tslint:disable-next-line:readonly-array
  public readonly signatureHelpTriggerCharacters: string[] = ['(', ','];

  public provideSignatureHelp(
    model: monaco.editor.IReadOnlyModel,
    position: monaco.Position,
    token: monaco.CancellationToken,
  ): monaco.Thenable<monaco.languages.SignatureHelp> {
    const resource = model.uri;

    // @ts-ignore
    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(
          async (worker) =>
            model.isDisposed()
              ? undefined
              : worker.createSignatures(resource.path, positionToOffset(model, position), {
                  [resource.path]: model.getValue(),
                }),
        ),
      ),
    );
  }
}
