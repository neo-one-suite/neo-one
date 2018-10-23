/// <reference types="monaco-editor/monaco" />
// tslint:disable:prefer-template
import _ from 'lodash';
import ts from 'typescript';
import { Command } from '../Command';

export const positionToOffset = (model: monaco.editor.ITextModel, position: monaco.IPosition): number =>
  model.getOffsetAt(position);

export const offsetToPosition = (model: monaco.editor.ITextModel, offset: number): monaco.IPosition =>
  model.getPositionAt(offset);

export const textSpanToRange = (model: monaco.editor.ITextModel, span: ts.TextSpan): monaco.IRange => {
  const p1 = offsetToPosition(model, span.start);
  const p2 = offsetToPosition(model, span.start + span.length);
  const { lineNumber: startLineNumber, column: startColumn } = p1;
  const { lineNumber: endLineNumber, column: endColumn } = p2;

  return { startLineNumber, startColumn, endLineNumber, endColumn };
};

export const getModel = (resource: monaco.Uri | string): monaco.editor.ITextModel | undefined => {
  let uri = resource;
  if (typeof uri === 'string') {
    uri = new monaco.Uri().with({ path: uri });
  }

  const model = monaco.editor.getModel(uri) as monaco.editor.ITextModel | undefined | null;

  return model == undefined || model.isDisposed() ? undefined : model;
};

export const convertFormattingOptions = (options: monaco.languages.FormattingOptions): ts.FormatCodeOptions => ({
  ConvertTabsToSpaces: options.insertSpaces,
  TabSize: options.tabSize,
  IndentSize: options.tabSize,
  IndentStyle: ts.IndentStyle.Smart,
  NewLineCharacter: '\n',
  InsertSpaceAfterCommaDelimiter: true,
  InsertSpaceAfterSemicolonInForStatements: true,
  InsertSpaceBeforeAndAfterBinaryOperators: true,
  InsertSpaceAfterKeywordsInControlFlowStatements: true,
  InsertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
  InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
  InsertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
  InsertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
  PlaceOpenBraceOnNewLineForControlBlocks: false,
  PlaceOpenBraceOnNewLineForFunctions: false,
});

export const convertTags = (tags: ReadonlyArray<ts.JSDocTagInfo> | undefined) =>
  tags
    ? '\n\n' +
      tags
        .map((tag) => {
          if (tag.name === 'example' && tag.text) {
            return `*@${tag.name}*\n` + '```typescript-internal\n' + tag.text + '\n```\n';
          }
          const label = `*@${tag.name}*`;
          if (!tag.text) {
            return label;
          }

          return label + (tag.text.match(/\r\n|\n/g) ? ' \n' + tag.text : ` - ${tag.text}`);
        })
        .join('  \n\n')
    : '';

export const convertTextChange = (
  model: monaco.editor.ITextModel,
  change: ts.TextChange,
): monaco.editor.ISingleEditOperation => ({
  text: change.newText,
  range: textSpanToRange(model, change.span),
});

export const convertAction = (
  model: monaco.editor.ITextModel,
  action: ts.CodeAction,
  // tslint:disable-next-line:readonly-array
): monaco.editor.ISingleEditOperation[] =>
  _.flatten(
    action.changes
      .filter((change) => change.fileName === model.uri.path)
      .map((change) => change.textChanges.map((textChange) => convertTextChange(model, textChange))),
  );

export const convertActions = (
  model: monaco.editor.ITextModel,
  actions: ReadonlyArray<ts.CodeAction>,
  // tslint:disable-next-line:readonly-array
): monaco.editor.ISingleEditOperation[] => _.flatten(actions.map((action) => convertAction(model, action)));

export const wrapCode = (languageID: string, code: string) =>
  '```' + languageID + '\n' + code + (code.endsWith('\n') ? '' : '\n') + '```';

export const convertCodeFixAction = (
  model: monaco.editor.ITextModel,
  action: ts.CodeFixAction,
): monaco.languages.CodeAction => ({
  title: action.description,
  command: {
    id: Command.ExecuteEdits,
    title: action.description,
    arguments: [
      _.flatten(
        action.changes
          .filter((change) => change.fileName === model.uri.path)
          .map((change) => change.textChanges.map((textChange) => convertTextChange(model, textChange))),
      ),
    ],
  },
});
