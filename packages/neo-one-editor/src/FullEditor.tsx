import { OutputMessage } from '@neo-one/local-browser';
import { Loading } from '@neo-one/react-common';
import * as React from 'react';
import { cold } from 'react-hot-loader';
import { connect } from 'react-redux';
import { Subscription } from 'rxjs';
import { ReduxStoreProvider } from './containers';
import { Editor, EditorFile, EditorFiles, TextRange } from './editor';
import {
  appendConsole,
  clearStore as clearStoreBase,
  configureStore,
  InitialEditorStateOptions,
  removeTestSuite,
  selectConsoleTestSuites,
  setTestsRunning,
  updateTest,
  updateTestSuite,
} from './editor/redux';
import { EditorContext } from './EditorContext';
import { MainEngine } from './engine/main';
import { EngineContentFiles, Test, TestRunnerCallbacks, TestSuite } from './types';

interface TestsPassContainerProps {
  readonly consoleTestSuites: readonly TestSuite[];
  readonly onTestsPass?: () => void;
}

const TestsPassContainer = connect(selectConsoleTestSuites)(
  ({ onTestsPass, consoleTestSuites }: TestsPassContainerProps) => {
    if (
      consoleTestSuites.length > 0 &&
      consoleTestSuites.every(
        (testSuite) =>
          testSuite.tests.length > 0 &&
          testSuite.tests.every((test) => test.status === 'pass' || test.status === 'skip'),
      ) &&
      onTestsPass !== undefined
    ) {
      // Call outside of render stack.
      setTimeout(onTestsPass);
    }

    // tslint:disable-next-line no-null-keyword
    return null;
  },
);

interface ExternalProps {
  readonly id: string;
  readonly createPreviewURL: () => string;
  readonly initialFiles: EngineContentFiles;
  readonly build?: boolean;
  readonly initialOptions?: InitialEditorStateOptions;
  readonly onTestsPass?: () => void;
  readonly clearFS?: boolean;
}

interface Props extends ExternalProps {
  readonly clearStore: (options?: InitialEditorStateOptions) => void;
  readonly appendOutput: (output: OutputMessage) => void;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
}

interface State {
  readonly file?: EditorFile;
  readonly range?: TextRange;
  readonly openFiles: EditorFiles;
  readonly engine?: MainEngine;
}

class FullEditorBase extends React.Component<Props, State> {
  public readonly state: State = { openFiles: [] };
  private mutableOpenFilesSubscription: Subscription | undefined;
  private mutableOutputSubscription: Subscription | undefined;
  private mutableMounted = true;

  public componentDidMount(): void {
    this.initializeEngine(this.props);
  }

  public componentWillUpdate(nextProps: Props): void {
    if (this.props.id !== nextProps.id) {
      this.initializeEngine(nextProps);
    }
  }

  public componentWillUnmount(): void {
    this.mutableMounted = false;
    this.dispose();
  }

  public render() {
    const { engine, file, range, openFiles } = this.state;
    const {
      id: _id,
      initialFiles: _initialFiles,
      appendOutput: _appendOutput,
      testRunnerCallbacks: _testRunnerCallbacks,
      onTestsPass,
      children: _children,
      clearStore: _clearStore,
      createPreviewURL: _createPreviewURL,
      initialOptions: _initialOptions,
      build: _build,
      clearFS: _clearFS,
      ...props
    } = this.props;

    return engine === undefined ? (
      <Loading {...props} />
    ) : (
      <EditorContext.Provider value={{ engine }}>
        <>
          <TestsPassContainer onTestsPass={onTestsPass} />
          <Editor file={file} range={range} openFiles={openFiles} onSelectFile={this.onSelectFile} {...props} />
        </>
      </EditorContext.Provider>
    );
  }

  private initializeEngine({
    id,
    createPreviewURL,
    initialFiles,
    testRunnerCallbacks,
    initialOptions,
    appendOutput,
    clearStore,
    build,
    clearFS,
  }: Props): void {
    this.dispose();
    this.setState({ engine: undefined, openFiles: [] });
    clearStore(initialOptions);
    MainEngine.create({
      id,
      createPreviewURL,
      initialFiles,
      editorCallbacks: {
        openFile: this.onSelectFile,
      },
      testRunnerCallbacks,
      clearFS,
    })
      .then(async (engine) => {
        if (this.props.id === id && this.mutableMounted) {
          if (build) {
            try {
              await engine.build();
            } catch (error) {
              // tslint:disable-next-line no-console
              console.error(error);
            }
          }
          const openFiles = engine.openFiles$.getValue().map((path) => engine.getFile(path));
          this.setState({
            engine,
            file: openFiles[0],
            openFiles,
          });
          this.mutableOpenFilesSubscription = engine.openFiles$.subscribe({
            next: (nextOpenFiles) => {
              this.setState({ openFiles: nextOpenFiles.map((path) => engine.getFile(path)) });
            },
          });
          this.mutableOutputSubscription = engine.output$.subscribe({
            next: (output) => {
              appendOutput(output);
            },
          });
        } else {
          await engine.dispose();
        }
      })
      .catch(async (error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
  }

  private readonly onSelectFile = (file?: EditorFile, range?: TextRange) => {
    this.setState({ file, range });
  };

  private dispose(): void {
    if (this.state.engine !== undefined) {
      this.state.engine.dispose().catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
    }

    this.disposeSubscription(this.mutableOpenFilesSubscription);
    this.mutableOpenFilesSubscription = undefined;

    this.disposeSubscription(this.mutableOutputSubscription);
    this.mutableOutputSubscription = undefined;
  }

  private disposeSubscription(subscription: Subscription | undefined) {
    if (subscription !== undefined) {
      subscription.unsubscribe();
    }
  }
}

const ConnectedFullEditor = connect(undefined, (dispatch) => ({
  appendOutput: (output: OutputMessage) => dispatch(appendConsole(output)),
  clearStore: (options?: InitialEditorStateOptions) => dispatch(clearStoreBase(options)),
  testRunnerCallbacks: {
    onUpdateSuite: async (suite: TestSuite) => {
      dispatch(updateTestSuite(suite));
    },
    onRemoveSuite: async (path: string) => {
      dispatch(removeTestSuite(path));
    },
    onUpdateTest: async (path: string, test: Test) => {
      dispatch(updateTest({ path, test }));
    },
    setTestsRunning: async (running: boolean) => {
      dispatch(setTestsRunning(running));
    },
  },
}))(FullEditorBase);

export const FullEditor = cold((props: ExternalProps) => (
  <ReduxStoreProvider createStore={configureStore}>
    <ConnectedFullEditor {...props} />
  </ReduxStoreProvider>
));
