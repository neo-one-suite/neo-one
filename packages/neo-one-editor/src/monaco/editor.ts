// tslint:disable no-submodule-imports no-any no-object-mutation
// @ts-ignore
import { SimpleEditorModelResolverService } from 'monaco-editor/esm/vs/editor/standalone/browser/simpleServices';
// @ts-ignore
import { StandaloneCodeEditorServiceImpl } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneCodeServiceImpl';
import { TextRange } from '../editor/types';
import { Command } from './Command';
import { getModel } from './features';

interface SetupEditorOptions {
  readonly openFile: (path: string, range?: TextRange) => void;
}

export function setupEditor({ openFile }: SetupEditorOptions) {
  StandaloneCodeEditorServiceImpl.prototype.openCodeEditor = async (input: any, source: any) => {
    openFile(input.resource.path, input.options.selection);

    return source;
  };

  SimpleEditorModelResolverService.prototype.createModelReference = async (uri: monaco.Uri) => {
    const model = getModel(uri);
    const editorModel = {
      async load() {
        return Promise.resolve(model);
      },
      dispose() {
        // do nothing
      },
      textEditorModel: model,
    };

    return Promise.resolve({
      object: editorModel,
      dispose() {
        // do nothing
      },
    });
  };
}

interface SetupStandaloneEditorOptions {
  readonly editor: monaco.editor.IStandaloneCodeEditor;
}

export function setupStandaloneEditor({ editor }: SetupStandaloneEditorOptions) {
  (editor as any)._commandService.addCommand({
    id: Command.ExecuteEdits,
    // tslint:disable-next-line readonly-array
    handler: (_something: any, edits: monaco.editor.IIdentifiedSingleEditOperation[]) => {
      editor.executeEdits(Command.ExecuteEdits, edits);
    },
  });
}
