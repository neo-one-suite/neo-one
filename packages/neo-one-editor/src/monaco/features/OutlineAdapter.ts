/// <reference types="monaco-editor/monaco" />
// tslint:disable no-object-mutation no-null-keyword strict-boolean-expressions no-array-mutation no-submodule-imports
// @ts-ignore
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main';
import { map, switchMap } from 'rxjs/operators';
import ts from 'typescript';
import { Adapter } from './Adapter';
import { Kind } from './Kind';
import { textSpanToRange } from './utils';

const outlineTypeTable: {
  // tslint:disable-next-line:readonly-keyword
  [kind: string]: monaco.languages.SymbolKind;
} = Object.create(null);
outlineTypeTable[Kind.module] = monaco.languages.SymbolKind.Module;
outlineTypeTable[Kind.class] = monaco.languages.SymbolKind.Class;
outlineTypeTable[Kind.enum] = monaco.languages.SymbolKind.Enum;
outlineTypeTable[Kind.interface] = monaco.languages.SymbolKind.Interface;
outlineTypeTable[Kind.memberFunction] = monaco.languages.SymbolKind.Method;
outlineTypeTable[Kind.memberVariable] = monaco.languages.SymbolKind.Property;
outlineTypeTable[Kind.memberGetAccessor] = monaco.languages.SymbolKind.Property;
outlineTypeTable[Kind.memberSetAccessor] = monaco.languages.SymbolKind.Property;
outlineTypeTable[Kind.variable] = monaco.languages.SymbolKind.Variable;
outlineTypeTable[Kind.const] = monaco.languages.SymbolKind.Variable;
outlineTypeTable[Kind.localVariable] = monaco.languages.SymbolKind.Variable;
outlineTypeTable[Kind.variable] = monaco.languages.SymbolKind.Variable;
outlineTypeTable[Kind.function] = monaco.languages.SymbolKind.Function;
outlineTypeTable[Kind.localFunction] = monaco.languages.SymbolKind.Function;

export class OutlineAdapter extends Adapter implements monaco.languages.DocumentSymbolProvider {
  public provideDocumentSymbols(
    model: monaco.editor.IReadOnlyModel,
    token: monaco.CancellationToken,
    // tslint:disable-next-line:readonly-array
  ): monaco.Thenable<monaco.languages.DocumentSymbol[]> {
    const resource = model.uri;

    // @ts-ignore
    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(
          async (worker): Promise<readonly ts.NavigationBarItem[]> =>
            model.isDisposed() ? [] : worker.getNavigationBarItems(resource.path),
        ),
        map((items) => {
          if (model.isDisposed()) {
            return [];
          }

          const convert = (
            bucket: monaco.languages.DocumentSymbol[],
            item: ts.NavigationBarItem,
            containerLabel?: string,
          ): void => {
            const result: monaco.languages.DocumentSymbol = {
              name: item.text,
              detail: '',
              kind: (outlineTypeTable[item.kind] ||
                monaco.languages.SymbolKind.Variable) as monaco.languages.SymbolKind,
              range: textSpanToRange(model, item.spans[0]),
              selectionRange: textSpanToRange(model, item.spans[0]),
              containerName: containerLabel,
            };

            if (item.childItems && item.childItems.length > 0) {
              // tslint:disable-next-line:no-loop-statement
              for (const child of item.childItems) {
                convert(bucket, child, result.name);
              }
            }

            bucket.push(result);
          };

          const res: monaco.languages.DocumentSymbol[] = [];
          items.forEach((item) => convert(res, item));

          return res;
        }),
      ),
    );
  }
}
