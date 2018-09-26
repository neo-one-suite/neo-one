// tslint:disable no-submodule-imports no-import-side-effect
/// <reference types="monaco-editor/monaco" />
import _ from 'lodash';
// @ts-ignore
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.main';
import * as React from 'react';
import { styled } from 'reakit';
import ResizeObserver from 'resize-observer-polyfill';
import '../../../monaco/monaco.contribution';
import { dark, light } from './theme';

const Container = styled.div`
  width: 100%;
  height: 100%;
`;

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const monac = monacoEditor as typeof monaco;

// tslint:disable-next-line no-any
monac.editor.defineTheme('light', light as any);
// tslint:disable-next-line no-any
monac.editor.defineTheme('dark', dark as any);

// Store editor states such as cursor position, selection and scroll position for each model
const editorStates = new Map<string, monaco.editor.ICodeEditorViewState>();

type Language = 'typescript' | 'typescript-smart-contract';
export interface FileEntry {
  readonly path: string;
  readonly content: string;
}
export interface Props {
  readonly file: FileEntry;
  readonly language: Language;
  readonly entries?: ReadonlyArray<FileEntry>;
  readonly autoFocus?: boolean;
  readonly onValueChange?: (value: string) => void;
}

export class MonacoEditor extends React.Component<Props> {
  private readonly ref = React.createRef<HTMLDivElement>();
  private readonly resizeRef = React.createRef<HTMLDivElement>();
  private mutableEditor: monaco.editor.IStandaloneCodeEditor | undefined;
  private mutableValueSubscription: monaco.IDisposable | undefined;
  private readonly resizeObserver = new ResizeObserver(
    _.debounce(
      () => {
        const editor = this.mutableEditor;
        if (editor !== undefined) {
          editor.layout();
        }
      },
      50,
      {
        leading: true,
        trailing: true,
      },
    ),
  );

  public componentDidMount(): void {
    const current = this.ref.current;
    if (current !== null) {
      this.mutableEditor = monac.editor.create(current, {
        language: this.props.language,
        theme: 'dark',
        minimap: { enabled: false },
      });

      const { file, autoFocus, entries = [] } = this.props;
      this.openFile(file.path, file.content, autoFocus);

      entries.forEach(({ path, content }) => {
        if (path !== file.path) {
          this.initializeFile(path, content);
        }
      });
    }

    const currentResize = this.resizeRef.current;
    if (currentResize !== null) {
      this.resizeObserver.observe(currentResize);
    }
  }

  public componentDidUpdate(prevProps: Props): void {
    const { file, autoFocus, entries } = this.props;

    if (file.path !== prevProps.file.path) {
      editorStates.set(prevProps.file.path, this.editor.saveViewState());

      this.openFile(file.path, file.content, autoFocus);
    }

    // else if (file.content !== this.editor.getModel().getValue()) {
    //   this.editor.executeEdits('', [
    //     {
    //       range: this.editor.getModel().getFullModelRange(),
    //       text: file.content,
    //     },
    //   ]);
    // }

    if (entries !== undefined && entries !== prevProps.entries) {
      // Update all changed entries for updated intellisense
      entries.forEach(({ path, content }) => {
        if (path !== file.path) {
          const previous =
            prevProps.entries === undefined ? undefined : prevProps.entries.find((entry) => entry.path === path);

          if (previous !== undefined && previous.content === content) {
            return;
          }

          this.initializeFile(path, content);
        }
      });
    }
  }

  public componentWillUnmount(): void {
    this.disposeValueSubscription();
    if (this.mutableEditor !== undefined) {
      this.mutableEditor.dispose();
    }

    this.resizeObserver.disconnect();
  }

  public render() {
    return (
      <Wrapper innerRef={this.resizeRef}>
        <Container innerRef={this.ref} />
      </Wrapper>
    );
  }

  private get editor(): monaco.editor.IStandaloneCodeEditor {
    if (this.mutableEditor === undefined) {
      throw new Error('Editor not created');
    }

    return this.mutableEditor;
  }

  private openFile(path: string, value: string, focus?: boolean): void {
    this.initializeFile(path, value);

    const model = monac.editor.getModels().find((mdl) => mdl.uri.path === path);

    if (model !== undefined) {
      this.editor.setModel(model);
    }

    const editorState = editorStates.get(path);
    if (editorState !== undefined) {
      this.editor.restoreViewState(editorState);
    }

    if (focus) {
      this.editor.focus();
    }

    this.disposeValueSubscription();
    this.mutableValueSubscription = this.editor.getModel().onDidChangeContent(() => {
      const editorValue = this.editor.getModel().getValue();

      const { onValueChange } = this.props;
      if (onValueChange !== undefined) {
        onValueChange(editorValue);
      }
    });
  }

  private disposeValueSubscription(): void {
    if (this.mutableValueSubscription !== undefined) {
      this.mutableValueSubscription.dispose();
      this.mutableValueSubscription = undefined;
    }
  }

  private initializeFile(path: string, value: string): void {
    let model = monac.editor.getModels().find((mdl) => mdl.uri.path === path);

    if (model && !model.isDisposed()) {
      model.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: value,
          },
        ],
        () => [],
      );
    } else {
      model = monac.editor.createModel(value, this.props.language, new monac.Uri().with({ path }));
      model.updateOptions({
        tabSize: 2,
        insertSpaces: true,
      });
    }
  }
}
