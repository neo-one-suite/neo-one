// tslint:disable no-submodule-imports no-import-side-effect
/// <reference types="monaco-editor/monaco" />
import styled from '@emotion/styled';
import { FileSystem } from '@neo-one/local-browser';
import _ from 'lodash';
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { MainEngine } from '../engine/main';
import { setupStandaloneEditor } from '../monaco/editor';
import { LanguageID } from '../monaco/language';
import { disposeModel } from '../monaco/utils';
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

defineThemes();

// Store editor states such as cursor position, selection and scroll position for each model
const editorStates = new Map<string, monaco.editor.ICodeEditorViewState>();

export interface Props {
  readonly file?: EditorFile;
  readonly range?: TextRange;
  readonly files?: EditorFiles;
  readonly engine: MainEngine;
  readonly autoFocus?: boolean;
  readonly onValueChange?: (value: string) => void;
  readonly onUpdateDiagnostics?: (path: string, diagnostics: readonly FileDiagnostic[]) => void;
}

export class MonacoEditor extends React.Component<Props> {
  private readonly ref = React.createRef<HTMLDivElement>();
  private readonly resizeRef = React.createRef<HTMLDivElement>();
  private mutableEditor: monaco.editor.IStandaloneCodeEditor | undefined;
  private mutableValueSubscription: Subscription | undefined;
  private readonly mutableCreatedModels: monaco.editor.ITextModel[] = [];
  // tslint:disable-next-line readonly-keyword
  private readonly mutableAnnotationSubscriptions: { [key: string]: monaco.IDisposable } = {};
  private readonly resizeObserver = new ResizeObserver(
    _.throttle(() => {
      this.forceUpdate(() => {
        const editor = this.mutableEditor;
        if (editor !== undefined) {
          editor.layout();
        }
      });
    }, 100),
  );

  public componentDidMount(): void {
    const current = this.ref.current;
    if (current !== null) {
      this.mutableEditor = monaco.editor.create(current, {
        language: LanguageID.TypeScript,
        theme: 'dark',
        ...this.getEditorOptions(this.props),
      });
      setupStandaloneEditor({ editor: this.mutableEditor });

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
        const viewState = this.editor.saveViewState();
        if (viewState !== null) {
          editorStates.set(prevProps.file.path, viewState);
        }
      }

      this.openFile(file, range, autoFocus);
    } else if (range !== undefined && !_.isEqual(range, prevProps.range)) {
      this.setSelection(range);
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
    this.mutableCreatedModels.forEach((model) => {
      disposeModel(model);
    });

    this.resizeObserver.disconnect();
  }

  public render() {
    return (
      <Wrapper ref={this.resizeRef}>
        <Container data-test="monaco-editor" ref={this.ref} />
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

  private openFile(file: EditorFile, range?: TextRange, focus?: boolean): void {
    this.initializeFile(file);

    const model = monaco.editor.getModels().find((mdl) => mdl.uri.path === file.path);

    if (model !== undefined) {
      this.editor.setModel(model);

      this.disposeValueSubscription();
      this.mutableValueSubscription = new Observable<undefined>((observer) => {
        const sub = model.onDidChangeContent(() => {
          observer.next(undefined);
        });

        return () => sub.dispose();
      })
        .pipe(
          map(() => {
            const editorValue = model.getValue();

            this.fs.writeFile(model.uri.path, editorValue).catch((error) => {
              // tslint:disable-next-line no-console
              console.error(error);
            });

            const { onValueChange } = this.props;
            if (onValueChange !== undefined) {
              onValueChange(editorValue);
            }
          }),
        )
        .subscribe();

      const editorState = editorStates.get(file.path);
      if (range !== undefined) {
        this.setSelection(range);
      } else if (editorState !== undefined) {
        this.editor.restoreViewState(editorState);
      }

      if (focus || range !== undefined) {
        this.editor.focus();
      }
    }
  }

  private setSelection(range?: TextRange): void {
    if (range) {
      if (range.endLineNumber !== undefined && range.endColumn !== undefined) {
        const selection = {
          startLineNumber: range.startLineNumber,
          startColumn: range.startColumn,
          endLineNumber: range.endLineNumber,
          endColumn: range.endColumn,
        };
        this.editor.setSelection(selection);
        this.editor.revealRangeInCenter(selection, 1 /* Immediate */);
      } else {
        const pos = {
          lineNumber: range.startLineNumber,
          column: range.startColumn,
        };
        this.editor.setPosition(pos);
        this.editor.revealPositionInCenter(pos, 1 /* Immediate */);
      }
    }
  }

  private disposeValueSubscription(): void {
    if (this.mutableValueSubscription !== undefined) {
      this.mutableValueSubscription.unsubscribe();
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
    let model = monaco.editor.getModels().find((mdl) => mdl.uri.path === file.path);

    const content = this.fs.readFileSync(file.path);
    const modeID = getLanguageIDForFile(file);
    if (model && !model.isDisposed() && model.getModeId() === modeID) {
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
      if (model) {
        disposeModel(model);
      }

      model = monaco.editor.createModel(content, modeID, monaco.Uri.from({ scheme: 'file', path: file.path }));
      this.mutableCreatedModels.push(model);
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
            this.convertDiagnostics(modelConst, monaco.editor.getModelMarkers({ resource: modelConst.uri })),
          );
        }
      });
    }
  }

  private convertDiagnostics(
    model: monaco.editor.ITextModel,
    markers: readonly monaco.editor.IMarker[],
  ): readonly FileDiagnostic[] {
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
