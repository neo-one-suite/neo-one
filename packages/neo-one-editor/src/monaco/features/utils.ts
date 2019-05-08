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
    uri = monaco.Uri.from({ scheme: 'file', path: uri });
  }

  const model = monaco.editor.getModel(uri) as monaco.editor.ITextModel | undefined | null;

  return model == undefined || model.isDisposed() ? undefined : model;
};

export const convertTextChange = (
  model: monaco.editor.ITextModel,
  change: ts.TextChange,
): monaco.languages.TextEdit => ({
  text: change.newText,
  range: textSpanToRange(model, change.span),
});

export const convertAction = (
  model: monaco.editor.ITextModel,
  action: ts.CodeAction,
  // tslint:disable-next-line:readonly-array
): monaco.languages.TextEdit[] =>
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
