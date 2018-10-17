import { OutputMessage } from '@neo-one/local-browser';
import { Loading } from '@neo-one/react-common';
import * as React from 'react';
import { connect } from 'react-redux';
import { Subscription } from 'rxjs';
import { ReduxStoreProvider } from './containers';
import { Editor, EditorFile, EditorFiles } from './editor';
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
import { createEngineContext, Engine } from './engine';
import { EngineContentFiles, Test, TestRunnerCallbacks, TestSuite } from './types';

interface TestsPassContainerProps {
  readonly consoleTestSuites: ReadonlyArray<TestSuite>;
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
      onTestsPass();
    }

    // tslint:disable-next-line no-null-keyword
    return null;
  },
);

interface ExternalProps {
  readonly id: string;
  readonly createPreviewURL: () => string;
  readonly initialFiles: EngineContentFiles;
  readonly initialOptions?: InitialEditorStateOptions;
  readonly onTestsPass?: () => void;
}

interface Props extends ExternalProps {
  readonly clearStore: (options?: InitialEditorStateOptions) => void;
  readonly appendOutput: (output: OutputMessage) => void;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
}

interface State {
  readonly file?: EditorFile;
  readonly openFiles: EditorFiles;
  readonly engine?: Engine;
}

class FullEditorBase extends React.Component<Props, State> {
  public readonly state: State = { openFiles: [] };
  private mutableOpenFilesSubscription: Subscription | undefined;
  private mutableOutputSubscription: Subscription | undefined;

  public componentDidMount(): void {
    this.initializeEngine(this.props);
  }

  public componentWillUpdate(nextProps: Props): void {
    if (this.props.id !== nextProps.id) {
      this.initializeEngine(nextProps);
    }
  }

  public render() {
    const { engine, file, openFiles } = this.state;
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
      ...props
    } = this.props;

    return engine === undefined ? (
      <Loading {...props} />
    ) : (
      <EditorContext.Provider value={{ engine }}>
        <>
          <TestsPassContainer onTestsPass={onTestsPass} />
          <Editor file={file} openFiles={openFiles} onSelectFile={this.onSelectFile} {...props} />
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
  }: Props): void {
    this.dispose();
    this.setState({ engine: undefined, openFiles: [] });
    clearStore(initialOptions);
    createEngineContext({ id, createPreviewURL })
      .then(async (context) =>
        Engine.create({ context, initialFiles, testRunnerCallbacks }).then(async (engine) => {
          if (this.props.id === id) {
            const openFiles = engine.context.openFiles$.getValue().map((path) => engine.getFile(path));
            this.setState({
              engine,
              file: openFiles[0],
              openFiles,
            });
            this.mutableOpenFilesSubscription = engine.context.openFiles$.subscribe({
              next: (nextOpenFiles) => {
                this.setState({ openFiles: nextOpenFiles.map((path) => engine.getFile(path)) });
              },
            });
            this.mutableOutputSubscription = engine.context.output$.subscribe({
              next: (output) => {
                appendOutput(output);
              },
            });
          } else {
            engine.dispose();
          }
        }),
      )
      .catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
  }

  private readonly onSelectFile = (file?: EditorFile) => {
    this.setState({ file });
  };

  private dispose(): void {
    if (this.state.engine !== undefined) {
      this.state.engine.dispose();
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

const ConnectedFullEditor = connect(
  undefined,
  (dispatch) => ({
    appendOutput: (output: OutputMessage) => dispatch(appendConsole(output)),
    clearStore: (options?: InitialEditorStateOptions) => dispatch(clearStoreBase(options)),
    testRunnerCallbacks: {
      onUpdateSuite: (suite: TestSuite) => dispatch(updateTestSuite(suite)),
      onRemoveSuite: (path: string) => dispatch(removeTestSuite(path)),
      onUpdateTest: (path: string, test: Test) => dispatch(updateTest({ path, test })),
      setTestsRunning: (running: boolean) => dispatch(setTestsRunning(running)),
    },
  }),
)(FullEditorBase);

export const FullEditor = (props: ExternalProps) => (
  <ReduxStoreProvider createStore={configureStore}>
    <ConnectedFullEditor {...props} />
  </ReduxStoreProvider>
);
