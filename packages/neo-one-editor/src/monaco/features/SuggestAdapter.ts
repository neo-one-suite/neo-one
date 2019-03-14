/// <reference types="monaco-editor/monaco" />
// tslint:disable:prefer-template
import { map, switchMap } from 'rxjs/operators';
import { Adapter } from './Adapter';
import { Kind } from './Kind';
import { convertActions, getModel, positionToOffset, wrapCode } from './utils';

interface CompletionItem extends monaco.languages.CompletionItem {
  readonly uri: monaco.Uri;
  readonly source?: string;
  readonly position: monaco.Position;
}

const convertKind = (kind: string): monaco.languages.CompletionItemKind => {
  switch (kind) {
    case Kind.primitiveType:
    case Kind.keyword:
      return monaco.languages.CompletionItemKind.Keyword;
    case Kind.variable:
    case Kind.localVariable:
      return monaco.languages.CompletionItemKind.Variable;
    case Kind.memberVariable:
    case Kind.memberGetAccessor:
    case Kind.memberSetAccessor:
    case Kind.indexSignature:
      return monaco.languages.CompletionItemKind.Field;
    case Kind.memberFunction:
    case Kind.constructSignature:
    case Kind.callSignature:
      return monaco.languages.CompletionItemKind.Method;
    case Kind.function:
      return monaco.languages.CompletionItemKind.Function;
    case Kind.enum:
      return monaco.languages.CompletionItemKind.Enum;
    case Kind.module:
      return monaco.languages.CompletionItemKind.Module;
    case Kind.class:
      return monaco.languages.CompletionItemKind.Class;
    case Kind.interface:
      return monaco.languages.CompletionItemKind.Interface;
    case Kind.warning:
      return monaco.languages.CompletionItemKind.File;
    default:
      return monaco.languages.CompletionItemKind.Property;
  }
};

export class SuggestAdapter extends Adapter implements monaco.languages.CompletionItemProvider {
  // tslint:disable-next-line readonly-array
  public get triggerCharacters() {
    return ['.', '"', "'", '`', '/', '@', '<'];
  }

  public provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken,
  ): monaco.languages.ProviderResult<monaco.languages.CompletionList> {
    const resource = model.uri;

    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(async (worker) =>
          model.isDisposed()
            ? undefined
            : worker.getCompletionsAtPosition(
                resource.path,
                positionToOffset(model, position),
                context.triggerCharacter,
                {
                  [resource.path]: model.getValue(),
                },
              ),
        ),
        map((info) => {
          if (!info || model.isDisposed()) {
            return { suggestions: [] };
          }

          return {
            suggestions: info.entries.map((entry) => {
              const word = model.getWordUntilPosition(position);
              const range = new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn,
              );

              return {
                uri: resource,
                source: entry.source,
                position,
                label: entry.name,
                insertText: entry.name,
                sortText: entry.sortText,
                kind: convertKind(entry.kind),
                range,
              };
            }),
          };
        }),
      ),
    );
  }

  public resolveCompletionItem(
    _model: monaco.editor.IReadOnlyModel,
    _position: monaco.Position,
    item: monaco.languages.CompletionItem,
    token: monaco.CancellationToken,
  ): monaco.Thenable<monaco.languages.CompletionItem> {
    const myItem = item as CompletionItem;
    const resource = myItem.uri;
    const position = myItem.position;
    const range = myItem.range;
    const model = getModel(resource);
    if (!model) {
      return Promise.resolve(myItem);
    }

    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(async (worker) =>
          model.isDisposed()
            ? undefined
            : worker.parseCompletionEntryDetails(
                resource.path,
                positionToOffset(model, position),
                myItem.label,
                undefined,
                myItem.source,
              ),
        ),
        map((details) => {
          if (!details || model.isDisposed()) {
            return myItem;
          }

          let rest = '';
          if (details.documentation !== undefined || details.tags !== undefined) {
            rest = '\n\n---\n\n' + details.documentation + details.tags;
          }

          return {
            uri: resource,
            position,
            range,
            label: details.name,
            kind: convertKind(details.kind),
            insertText: myItem.insertText,
            documentation: {
              value: wrapCode(model.getModeId(), details.contents) + rest,
            },
            additionalTextEdits:
              details.codeActions === undefined ? undefined : convertActions(model, details.codeActions),
          };
        }),
      ),
    );
  }
}
