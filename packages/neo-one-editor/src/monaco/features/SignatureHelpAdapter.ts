/// <reference types="monaco-editor/monaco" />
// tslint:disable no-object-mutation readonly-array no-array-mutation
import { map, switchMap } from 'rxjs/operators';
import ts from 'typescript';
import { Adapter } from './Adapter';
import { positionToOffset } from './utils';

export class SignatureHelpAdapter extends Adapter implements monaco.languages.SignatureHelpProvider {
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
              : worker.getSignatureHelpItems(resource.path, positionToOffset(model, position), {
                  [resource.path]: model.getValue(),
                }),
        ),
        map((info) => {
          if (!info || model.isDisposed()) {
            return undefined;
          }

          const ret: monaco.languages.SignatureHelp = {
            activeSignature: info.selectedItemIndex,
            activeParameter: info.argumentIndex,
            signatures: [],
          };

          info.items.forEach((item) => {
            const signature: monaco.languages.SignatureInformation = {
              label: '',
              documentation: undefined,
              parameters: [],
            };

            signature.label += ts.displayPartsToString(item.prefixDisplayParts);
            item.parameters.forEach((p, i, a) => {
              const label = ts.displayPartsToString(p.displayParts);
              const parameter: monaco.languages.ParameterInformation = {
                label,
                documentation: {
                  value: ts.displayPartsToString(p.documentation),
                },
              };
              signature.label += label;
              signature.parameters.push(parameter);
              if (i < a.length - 1) {
                signature.label += ts.displayPartsToString(item.separatorDisplayParts);
              }
            });
            signature.label += ts.displayPartsToString(item.suffixDisplayParts);
            ret.signatures.push(signature);
          });

          return ret;
        }),
      ),
    );
  }
}
