// tslint:disable no-null-keyword
import { ActionMap } from 'constate';
import * as React from 'react';
import { connect } from 'react-redux';
import { Container, Flex, Grid, Hidden, styled } from 'reakit';
import { ifProp } from 'styled-tools';
import { EditorContext } from '../EditorContext';
import { Preview } from '../preview';
import { ComponentProps } from '../types';
import { EditorToolbar } from './EditorToolbar';
import { EditorView } from './EditorView';
import { EditorState, selectPreviewEnabled, selectPreviewOpen, setFileProblems } from './redux';
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
  readonly file?: EditorFile;
  readonly onSelectFile: (file?: EditorFile) => void;
  readonly openFiles: EditorFiles;
}

interface State {
  readonly range?: TextRange;
}

const INITIAL_STATE: State = {};

interface Actions {
  readonly onSelectRange: (range: TextRange) => void;
}

const actions: ActionMap<State, Actions> = {
  onSelectRange: (range: TextRange) => () => ({
    range,
  }),
};

interface Props extends ExternalProps {
  readonly previewOpen: boolean;
  readonly previewEnabled: boolean;
  readonly onChangeProblems: (path: string, diagnostics: ReadonlyArray<FileDiagnostic>) => void;
}

const EditorBase = ({
  file,
  openFiles,
  previewOpen,
  previewEnabled,
  onSelectFile,
  onChangeProblems,
  ...props
}: Props & ComponentProps<typeof Wrapper>) => (
  <EditorContext.Consumer>
    {({ engine }) => (
      <Container initialState={INITIAL_STATE} actions={actions}>
        {({ range, onSelectRange }) => (
          <Wrapper {...props}>
            <EditorWrapper previewOpen={previewOpen}>
              <EditorView
                file={file}
                openFiles={openFiles}
                onSelectFile={onSelectFile}
                onChangeProblems={onChangeProblems}
                range={range}
              />
              {previewEnabled ? (
                <Hidden visible={previewOpen}>
                  <Preview />
                </Hidden>
              ) : null}
            </EditorWrapper>
            <EditorToolbar
              file={file}
              onSelectRange={(path, selectedRange) => {
                onSelectFile(engine.getFile(path));
                onSelectRange(selectedRange);
              }}
            />
          </Wrapper>
        )}
      </Container>
    )}
  </EditorContext.Consumer>
);

export const Editor = connect(
  (state: EditorState) => ({
    ...selectPreviewOpen(state),
    ...selectPreviewEnabled(state),
  }),
  (dispatch) => ({
    // tslint:disable-next-line no-unnecessary-type-annotation
    onChangeProblems: (path: string, diagnostics: ReadonlyArray<FileDiagnostic>) =>
      dispatch(setFileProblems({ path, problems: diagnostics })),
  }),
)(EditorBase);
