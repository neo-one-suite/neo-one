import { ActionMap } from 'constate';
import * as React from 'react';
import { connect } from 'react-redux';
import { Container, Flex, Grid, Hidden, styled } from 'reakit';
import { ifProp } from 'styled-tools';
import { EditorContext } from '../EditorContext';
import { Engine } from '../engine';
import { Preview } from '../preview';
import { ComponentProps } from '../types';
import { EditorToolbar } from './EditorToolbar';
import { EditorView } from './EditorView';
import { selectPreviewOpen, setFileProblems } from './redux';
import { EditorFile, EditorFiles, FileDiagnostic, TextRange } from './types';

const Wrapper = styled(Flex)`
  align-self: stretch;
  justify-self: stretch;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;

const EditorWrapper = styled(Grid)<{ readonly previewOpen: boolean }>`
  grid:
    'editor preview' auto
    / 1fr ${ifProp('previewOpen', '1fr', '0')};
  min-height: 0;
  min-width: 0;
  height: 100%;
  width: 100%;
`;

interface ExternalProps {
  readonly openFiles: EditorFiles;
  readonly files: EditorFiles;
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
  readonly previewOpen: boolean;
  readonly onChangeProblems: (path: string, diagnostics: ReadonlyArray<FileDiagnostic>) => void;
}

const EditorBase = ({
  openFiles,
  files,
  previewOpen,
  onChangeProblems,
  ...props
}: Props & ComponentProps<typeof Wrapper>) => (
  <EditorContext.Consumer>
    {({ engine }) => (
      <Container initialState={{ ...INITIAL_STATE, file: openFiles[0] }} actions={createActions(engine)}>
        {({ range, file, onSelectFile, onSelectRange }) => (
          <Wrapper {...props}>
            <EditorWrapper previewOpen={previewOpen}>
              <EditorView
                file={file}
                openFiles={openFiles}
                files={files}
                onSelectFile={onSelectFile}
                onChangeProblems={onChangeProblems}
                range={range}
              />
              <Hidden visible={previewOpen}>
                <Preview />
              </Hidden>
            </EditorWrapper>
            <EditorToolbar file={file} onSelectRange={onSelectRange} />
          </Wrapper>
        )}
      </Container>
    )}
  </EditorContext.Consumer>
);

export const Editor = connect(
  selectPreviewOpen,
  (dispatch) => ({
    // tslint:disable-next-line no-unnecessary-type-annotation
    onChangeProblems: (path: string, diagnostics: ReadonlyArray<FileDiagnostic>) =>
      dispatch(setFileProblems({ path, problems: diagnostics })),
  }),
)(EditorBase);
