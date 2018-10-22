// tslint:disable:prefer-template
import { map, switchMap } from 'rxjs/operators';
import ts from 'typescript';
import { Adapter } from './Adapter';
import { Kind } from './Kind';
import { convertActions, convertTags, getModel, positionToOffset, wrapCode } from './utils';

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
    model: monaco.editor.IReadOnlyModel,
    position: monaco.Position,
    token: monaco.CancellationToken,
    context: monaco.languages.CompletionContext,
    // tslint:disable-next-line readonly-array
  ): monaco.Thenable<monaco.languages.CompletionItem[]> {
    const resource = model.uri;
    const offset = positionToOffset(model, position);

    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(async (worker) =>
          worker.getCompletionsAtPosition(resource.path, offset, context.triggerCharacter, {
            [resource.path]: model.getValue(),
          }),
        ),
        map((info) => {
          if (!info) {
            return [];
          }

          return info.entries.map((entry) => ({
            uri: resource,
            source: entry.source,
            position,
            label: entry.name,
            sortText: entry.sortText,
            kind: convertKind(entry.kind),
          }));
        }),
      ),
    );
  }

  public resolveCompletionItem(
    item: monaco.languages.CompletionItem,
    token: monaco.CancellationToken,
  ): monaco.Thenable<monaco.languages.CompletionItem> {
    const myItem = item as CompletionItem;
    const resource = myItem.uri;
    const position = myItem.position;
    const model = getModel(resource);
    if (!model) {
      return Promise.resolve(myItem);
    }

    return this.toPromise(
      token,
      this.worker$.pipe(
        switchMap(async (worker) =>
          worker.getCompletionEntryDetails(
            resource.path,
            positionToOffset(model, position),
            myItem.label,
            undefined,
            myItem.source,
          ),
        ),
        map((details) => {
          if (!details) {
            return myItem;
          }

          const contents = ts.displayPartsToString(details.displayParts);
          let rest = '';
          if (details.documentation !== undefined || details.tags !== undefined) {
            rest = '\n\n---\n\n' + ts.displayPartsToString(details.documentation) + convertTags(details.tags);
          }

          return {
            uri: resource,
            position,
            label: details.name,
            kind: convertKind(details.kind),
            documentation: {
              value: wrapCode(model.getModeId(), contents) + rest,
            },
            additionalTextEdits:
              details.codeActions === undefined ? undefined : convertActions(model, details.codeActions),
          };
        }),
      ),
    );
  }
}
