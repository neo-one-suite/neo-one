import { OutputMessage } from '@neo-one/local-browser';
import { Container, OnMountProps } from 'constate';
import * as React from 'react';
import { connect } from 'react-redux';
import { ReduxStoreProvider } from './containers';
import { Editor, EditorFiles } from './editor';
import { appendConsole, configureStore } from './editor/redux';
import { EditorContext } from './EditorContext';
import { Engine } from './engine';
import { Loading } from './Loading';
import { EngineContentFiles } from './types';

interface State {
  readonly id: string;
  readonly initialFiles: EngineContentFiles;
  readonly files: EditorFiles;
  readonly engine?: Engine;
  readonly appendOutput: (output: OutputMessage) => void;
}

const onMount = ({ state: { id, initialFiles, appendOutput }, setState }: OnMountProps<State>) => {
  Engine.create({ id, initialFiles })
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
}
const FullEditorBase = ({ id, initialFiles, appendOutput, ...props }: Props) => (
  <Container
    initialState={{
      id,
      initialFiles,
      files: [],
      appendOutput,
    }}
    onMount={onMount}
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
  }),
)(FullEditorBase);

export const FullEditor = (props: ExternalProps) => (
  <ReduxStoreProvider createStore={configureStore}>
    <ConnectedFullEditor {...props} />
  </ReduxStoreProvider>
);
