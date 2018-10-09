import { ActionMap } from 'constate';
import * as React from 'react';
import { connect } from 'react-redux';
import { Container, Flex, styled } from 'reakit';
import { EditorContext } from '../EditorContext';
import { Engine } from '../engine';
import { ComponentProps } from '../types';
import { EditorToolbar } from './EditorToolbar';
import { EditorView } from './EditorView';
import { setFileProblems } from './redux';
import { EditorFile, EditorFiles, FileDiagnostic, TextRange } from './types';

const Wrapper = styled(Flex)`
  align-self: stretch;
  justify-self: stretch;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;

interface ExternalProps {
  readonly files: EditorFiles;
  readonly buildFiles: EditorFiles;
}

interface State {
  readonly file?: EditorFile;
  readonly range?: TextRange;
}

const INITIAL_STATE: State = {};

interface Actions {
  readonly onSelectFile: (file: EditorFile) => void;
  readonly onSelectRange: (path: string, range: TextRange) => void;
}

const createActions = (engine: Engine): ActionMap<State, Actions> => ({
  onSelectFile: (file: EditorFile) => () => ({
    file,
  }),
  onSelectRange: (path: string, range: TextRange) => () => ({
    file: engine.getFile(path),
    range,
  }),
});

interface Props extends ExternalProps {
  readonly onChangeProblems: (path: string, diagnostics: ReadonlyArray<FileDiagnostic>) => void;
}

const EditorBase = ({ files, buildFiles, onChangeProblems, ...props }: Props & ComponentProps<typeof Wrapper>) => (
  <EditorContext.Consumer>
    {({ engine }) => (
      <Container initialState={{ ...INITIAL_STATE, file: files[0] }} actions={createActions(engine)}>
        {({ range, file, onSelectFile, onSelectRange }) => (
          <Wrapper {...props}>
            <EditorView
              file={file}
              files={files}
              buildFiles={buildFiles}
              onSelectFile={onSelectFile}
              onChangeProblems={onChangeProblems}
              range={range}
            />
            <EditorToolbar file={file} onSelectRange={onSelectRange} />
          </Wrapper>
        )}
      </Container>
    )}
  </EditorContext.Consumer>
);

export const Editor = connect(
  undefined,
  (dispatch) => ({
    // tslint:disable-next-line no-unnecessary-type-annotation
    onChangeProblems: (path: string, diagnostics: ReadonlyArray<FileDiagnostic>) =>
      dispatch(setFileProblems({ path, problems: diagnostics })),
  }),
)(EditorBase);
