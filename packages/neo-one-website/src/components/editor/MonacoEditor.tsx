// tslint:disable no-submodule-imports no-import-side-effect
/// <reference types="monaco-editor/monaco" />
import _ from 'lodash';
// @ts-ignore
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.main';
import * as React from 'react';
import { styled } from 'reakit';
import ResizeObserver from 'resize-observer-polyfill';
import '../../monaco/monaco.contribution';
import { dark, light } from './theme';
import { FileDiagnostic, FileDiagnosticSeverity, TextRange } from './types';

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  position: relative;
`;

const Wrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
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
  readonly language: Language;
}
export interface Props {
  readonly file: FileEntry;
  readonly range?: TextRange;
  readonly entries?: ReadonlyArray<FileEntry>;
  readonly autoFocus?: boolean;
  readonly readOnly?: boolean;
  readonly onValueChange?: (value: string) => void;
  readonly onUpdateDiagnostics?: (path: string, diagnostics: ReadonlyArray<FileDiagnostic>) => void;
}

export class MonacoEditor extends React.Component<Props> {
  private readonly ref = React.createRef<HTMLDivElement>();
  private readonly resizeRef = React.createRef<HTMLDivElement>();
  private mutableEditor: monaco.editor.IStandaloneCodeEditor | undefined;
  private mutableValueSubscription: monaco.IDisposable | undefined;
  // tslint:disable-next-line readonly-keyword
  private readonly mutableAnnotationSubscriptions: { [key: string]: monaco.IDisposable } = {};
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
        language: 'typescript',
        theme: 'dark',
        ...this.getEditorOptions(this.props),
      });

      const { file, autoFocus, entries = [] } = this.props;
      this.openFile(file, undefined, autoFocus);

      entries.forEach((newFile) => {
        if (newFile.path !== file.path) {
          this.initializeFile(newFile);
        }
      });
    }

    const currentResize = this.resizeRef.current;
    if (currentResize !== null) {
      this.resizeObserver.observe(currentResize);
    }
  }

  public componentDidUpdate(prevProps: Props): void {
    const { file, range, autoFocus, entries } = this.props;

    if (file.path !== prevProps.file.path) {
      editorStates.set(prevProps.file.path, this.editor.saveViewState());

      this.openFile(file, range, autoFocus);
    } else if (range !== undefined && !_.isEqual(range, prevProps.range)) {
      this.editor.setSelection(range);
    }

    const prevOptions = this.getEditorOptions(prevProps);
    const options = this.getEditorOptions(this.props);
    if (!_.isEqual(prevOptions, options) && this.mutableEditor !== undefined) {
      this.mutableEditor.updateOptions(options);
      this.editor.focus();
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
      entries.forEach((newFile) => {
        if (newFile.path !== file.path) {
          const previous =
            prevProps.entries === undefined
              ? undefined
              : prevProps.entries.find((entry) => entry.path === newFile.path);

          if (previous !== undefined && previous.content === newFile.content) {
            return;
          }

          this.initializeFile(newFile);
        }
      });
    }
  }

  public componentWillUnmount(): void {
    this.disposeValueSubscription();
    this.disposeAnnotationSubscriptions();
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

  private openFile(file: FileEntry, range?: monaco.IRange, focus?: boolean): void {
    this.initializeFile(file);

    const model = monac.editor.getModels().find((mdl) => mdl.uri.path === file.path);

    if (model !== undefined) {
      this.editor.setModel(model);
    }

    const editorState = editorStates.get(file.path);
    if (range !== undefined) {
      this.editor.setSelection(range);
    } else if (editorState !== undefined) {
      this.editor.restoreViewState(editorState);
    }

    if (focus || range !== undefined) {
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

  private disposeAnnotationSubscriptions(): void {
    Object.entries(this.mutableAnnotationSubscriptions).forEach(([key, subscription]) => {
      // tslint:disable-next-line no-dynamic-delete
      delete this.mutableAnnotationSubscriptions[key];
      subscription.dispose();
    });
  }

  private initializeFile(file: FileEntry): void {
    let model = monac.editor.getModels().find((mdl) => mdl.uri.path === file.path);

    if (model && !model.isDisposed()) {
      model.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: file.content,
          },
        ],
        () => [],
      );
    } else {
      model = monac.editor.createModel(file.content, file.language, new monac.Uri().with({ path: file.path }));
      model.updateOptions({
        tabSize: 2,
        insertSpaces: true,
      });

      const modelConst = model;
      this.mutableAnnotationSubscriptions[file.path] = model.onDidChangeDecorations(() => {
        const { onUpdateDiagnostics } = this.props;
        if (onUpdateDiagnostics !== undefined) {
          onUpdateDiagnostics(
            modelConst.uri.path,
            this.convertDiagnostics(modelConst, monac.editor.getModelMarkers({ resource: modelConst.uri })),
          );
        }
      });
    }
  }

  private convertDiagnostics(
    model: monaco.editor.ITextModel,
    markers: ReadonlyArray<monaco.editor.IMarker>,
  ): ReadonlyArray<FileDiagnostic> {
    return markers.map((marker) => ({
      path: model.uri.path,
      owner: marker.owner,
      message: marker.message,
      startColumn: marker.startColumn,
      startLineNumber: marker.startLineNumber,
      endColumn: marker.endColumn,
      endLineNumber: marker.endLineNumber,
      // tslint:disable-next-line no-useless-cast no-unnecessary-type-assertion
      severity: (marker.severity === 1
        ? 'hint'
        : marker.severity === 2
          ? 'info'
          : marker.severity === 4
            ? 'warning'
            : 'error') as FileDiagnosticSeverity,
    }));
  }

  private getEditorOptions(props: Props): monaco.editor.IEditorOptions {
    return {
      readOnly: props.readOnly,
      minimap: { enabled: false },
    };
  }
}
