import { OutputMessage } from '@neo-one/local-browser';
import * as React from 'react';
import { connect } from 'react-redux';
import { ReduxStoreProvider } from './containers';
import { Editor, EditorFiles } from './editor';
import {
  appendConsole,
  clearStore as clearStoreBase,
  configureStore,
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
  readonly initialFiles: EngineContentFiles;
  readonly onTestsPass?: () => void;
}

interface Props extends ExternalProps {
  readonly clearStore: () => void;
  readonly appendOutput: (output: OutputMessage) => void;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
}

interface State {
  readonly files: EditorFiles;
  readonly buildFiles: EditorFiles;
  readonly engine?: Engine;
}

class FullEditorBase extends React.Component<Props, State> {
  public readonly state: State = { files: [], buildFiles: [] };

  public componentDidMount(): void {
    this.initializeEngine(this.props);
  }

  public componentWillUpdate(nextProps: Props): void {
    if (this.props.id !== nextProps.id) {
      this.initializeEngine(nextProps);
    }
  }

  public render() {
    const { engine, buildFiles, files } = this.state;
    const {
      id: _id,
      initialFiles: _initialFiles,
      appendOutput: _appendOutput,
      testRunnerCallbacks: _testRunnerCallbacks,
      onTestsPass,
      children: _children,
      clearStore: _clearStore,
      ...props
    } = this.props;

    return engine === undefined ? (
      <Loading {...props} />
    ) : (
      <EditorContext.Provider value={{ engine }}>
        <>
          <TestsPassContainer onTestsPass={onTestsPass} />
          <Editor files={files} buildFiles={buildFiles} {...props} />
        </>
      </EditorContext.Provider>
    );
  }

  private initializeEngine({ id, initialFiles, testRunnerCallbacks, appendOutput, clearStore }: Props): void {
    this.setState({ engine: undefined, files: [], buildFiles: [] });
    clearStore();
    Engine.create({ id, initialFiles, testRunnerCallbacks })
      .then(async (engine) => {
        this.setState({ engine, files: engine.openFiles$.getValue() });
        engine.openFiles$.subscribe({
          next: (files) => {
            this.setState({ files });
          },
        });
        engine.buildFiles$.subscribe({
          next: (buildFiles) => {
            this.setState({ buildFiles });
          },
        });
        engine.output$.subscribe({
          next: (output) => {
            appendOutput(output);
          },
        });
      })
      .catch((error) => {
        // tslint:disable-next-line no-console
        console.error(error);
      });
  }
}

const ConnectedFullEditor = connect(
  undefined,
  (dispatch) => ({
    appendOutput: (output: OutputMessage) => dispatch(appendConsole(output)),
    clearStore: () => dispatch(clearStoreBase()),
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
