// tslint:disable no-submodule-imports no-import-side-effect
/// <reference types="monaco-editor/monaco" />
import { FileSystem } from '@neo-one/local-browser';
import _ from 'lodash';
// @ts-ignore
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.main';
import * as React from 'react';
import { styled } from 'reakit';
import ResizeObserver from 'resize-observer-polyfill';
import { Engine } from '../engine';
import { getLanguageID, LanguageType, setupLanguages } from '../monaco/language';
import { defineThemes } from './theme';
import { EditorFile, EditorFiles, FileDiagnostic, FileDiagnosticSeverity, TextRange } from './types';
import { getLanguageIDForFile } from './utils';

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

defineThemes();

// Store editor states such as cursor position, selection and scroll position for each model
const editorStates = new Map<string, monaco.editor.ICodeEditorViewState>();

export interface Props {
  readonly file?: EditorFile;
  readonly range?: TextRange;
  readonly files?: EditorFiles;
  readonly engine: Engine;
  readonly autoFocus?: boolean;
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
      setupLanguages(this.id, this.fs);
      this.mutableEditor = monac.editor.create(current, {
        language: getLanguageID(this.id, LanguageType.TypeScript),
        theme: 'dark',
        ...this.getEditorOptions(this.props),
      });

      const { file, autoFocus, files = [] } = this.props;
      if (file !== undefined) {
        this.openFile(file, undefined, autoFocus);
      }

      files.forEach((newFile) => {
        if (file === undefined || newFile.path !== file.path) {
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
    const { file, range, autoFocus, files } = this.props;
    if (file === undefined) {
      // tslint:disable-next-line no-null-keyword
      this.editor.setModel(null);
    } else if (prevProps.file === undefined || file.path !== prevProps.file.path) {
      if (prevProps.file !== undefined) {
        editorStates.set(prevProps.file.path, this.editor.saveViewState());
      }

      this.openFile(file, range, autoFocus);
    } else if (range !== undefined && !_.isEqual(range, prevProps.range)) {
      this.editor.setSelection(range);
    }

    const prevOptions = this.getEditorOptions(prevProps);
    const options = this.getEditorOptions(this.props);
    if (!_.isEqual(prevOptions, options)) {
      this.editor.updateOptions(options);
      this.editor.focus();
    }

    if (files !== undefined && files !== prevProps.files) {
      // Update all changed files for updated intellisense
      files.forEach((newFile) => {
        if (file === undefined || newFile.path !== file.path) {
          const previous =
            prevProps.files === undefined ? undefined : prevProps.files.find((entry) => entry.path === newFile.path);

          if (previous === undefined) {
            this.initializeFile(newFile);
          }
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
        <Container data-test="monaco-editor" innerRef={this.ref} />
      </Wrapper>
    );
  }

  private get editor(): monaco.editor.IStandaloneCodeEditor {
    if (this.mutableEditor === undefined) {
      throw new Error('Editor not created');
    }

    return this.mutableEditor;
  }

  private get fs(): FileSystem {
    return this.props.engine.fs;
  }

  private get id(): string {
    return this.props.engine.id;
  }

  private openFile(file: EditorFile, range?: monaco.IRange, focus?: boolean): void {
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
      const editorModel = this.editor.getModel();
      const editorValue = editorModel.getValue();

      this.props.engine.writeFileSync(editorModel.uri.path, editorValue);

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

  private initializeFile(file: EditorFile): void {
    let model = monac.editor.getModels().find((mdl) => mdl.uri.path === file.path);

    const content = this.fs.readFileSync(file.path);
    if (model && !model.isDisposed()) {
      model.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: content,
          },
        ],
        () => [],
      );
    } else {
      model = monac.editor.createModel(
        content,
        getLanguageIDForFile(this.id, file),
        new monac.Uri().with({ path: file.path }),
      );
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
      readOnly: props.file !== undefined && !props.file.writable,
      minimap: { enabled: false },
    };
  }
}
