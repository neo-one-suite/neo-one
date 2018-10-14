import { OutputMessage } from '@neo-one/local-browser';
import * as React from 'react';
import { connect } from 'react-redux';
import { Subscription } from 'rxjs';
import { ReduxStoreProvider } from './containers';
import { Editor, EditorFiles } from './editor';
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
import { Engine } from './engine';
import { Loading } from './Loading';
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
  readonly createPreviewURL: (id: string) => string;
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
  readonly openFiles: EditorFiles;
  readonly files: EditorFiles;
  readonly engine?: Engine;
}

class FullEditorBase extends React.Component<Props, State> {
  public readonly state: State = { openFiles: [], files: [] };
  private mutableOpenFilesSubscription: Subscription | undefined;
  private mutableBuildFilesSubscription: Subscription | undefined;
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
    const { engine, files, openFiles } = this.state;
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
          <Editor openFiles={openFiles} files={files} {...props} />
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
    this.setState({ engine: undefined, openFiles: [], files: [] });
    clearStore(initialOptions);
    Engine.create({ id, createPreviewURL, initialFiles, testRunnerCallbacks })
      .then(async (engine) => {
        if (this.props.id === id) {
          this.setState({ engine, openFiles: engine.openFiles$.getValue() });
          this.mutableOpenFilesSubscription = engine.openFiles$.subscribe({
            next: (openFiles) => {
              this.setState({ openFiles });
            },
          });
          this.mutableBuildFilesSubscription = engine.files$.subscribe({
            next: (files) => {
              this.setState({ files });
            },
          });
          this.mutableOutputSubscription = engine.output$.subscribe({
            next: (output) => {
              appendOutput(output);
            },
          });
        }
      })
      .catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
  }

  private dispose(): void {
    if (this.state.engine !== undefined) {
      this.state.engine.dispose();
    }

    this.disposeSubscription(this.mutableOpenFilesSubscription);
    this.mutableOpenFilesSubscription = undefined;

    this.disposeSubscription(this.mutableBuildFilesSubscription);
    this.mutableBuildFilesSubscription = undefined;

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
