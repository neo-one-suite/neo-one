import { OutputMessage } from '@neo-one/local-browser';
import { Container, OnMountProps } from 'constate';
import * as React from 'react';
import { connect } from 'react-redux';
import { ReduxStoreProvider } from './containers';
import { Editor, EditorFiles } from './editor';
import {
  appendConsole,
  configureStore,
  removeTestSuite,
  setTestsRunning,
  updateTest,
  updateTestSuite,
} from './editor/redux';
import { EditorContext } from './EditorContext';
import { Engine } from './engine';
import { Loading } from './Loading';
import { EngineContentFiles, Test, TestRunnerCallbacks, TestSuite } from './types';

interface State {
  readonly id: string;
  readonly initialFiles: EngineContentFiles;
  readonly files: EditorFiles;
  readonly engine?: Engine;
  readonly appendOutput: (output: OutputMessage) => void;
}

const createOnMount = (testRunnerCallbacks: TestRunnerCallbacks) => ({
  state: { id, initialFiles, appendOutput },
  setState,
}: OnMountProps<State>) => {
  Engine.create({ id, initialFiles, testRunnerCallbacks })
    .then(async (engine) => {
      setState({ engine, files: engine.openFiles$.getValue() });
      engine.openFiles$.subscribe({
        next: (files) => {
          setState({ files });
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
};

interface ExternalProps {
  readonly id: string;
  readonly initialFiles: EngineContentFiles;
}

interface Props extends ExternalProps {
  readonly appendOutput: (output: OutputMessage) => void;
  readonly testRunnerCallbacks: TestRunnerCallbacks;
}
const FullEditorBase = ({ id, initialFiles, appendOutput, testRunnerCallbacks, ...props }: Props) => (
  <Container
    initialState={{
      id,
      initialFiles,
      files: [],
      appendOutput,
    }}
    onMount={createOnMount(testRunnerCallbacks)}
  >
    {({ files, engine }) =>
      engine === undefined ? (
        <Loading {...props} />
      ) : (
        <EditorContext.Provider value={{ engine }}>
          <Editor files={files} {...props} />
        </EditorContext.Provider>
      )
    }
  </Container>
);

const ConnectedFullEditor = connect(
  undefined,
  (dispatch) => ({
    appendOutput: (output: OutputMessage) => dispatch(appendConsole(output)),
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
