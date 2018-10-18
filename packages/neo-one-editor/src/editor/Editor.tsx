// tslint:disable no-null-keyword
import { SplitPane } from '@neo-one/react-common';
import { ActionMap } from 'constate';
import * as React from 'react';
import { connect } from 'react-redux';
import { Container, Flex, styled } from 'reakit';
import { EditorContext } from '../EditorContext';
import { Preview } from '../preview';
import { ComponentProps, EditorContextType } from '../types';
import { EditorToolbar } from './EditorToolbar';
import { EditorView } from './EditorView';
import { EditorState, openPreview, selectPreviewEnabled, selectPreviewOpen, setFileProblems } from './redux';
import { EditorFile, EditorFiles, FileDiagnostic, TextRange } from './types';

const Wrapper = styled(Flex)`
  align-self: stretch;
  justify-self: stretch;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;

// tslint:disable-next-line no-any
const StyledSplitPane = styled(SplitPane as any)`
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
  readonly onOpenPreview: () => void;
}

const EditorBase = ({
  file,
  openFiles,
  previewOpen,
  previewEnabled,
  onSelectFile,
  onOpenPreview,
  onChangeProblems,
  ...props
}: Props & ComponentProps<typeof Wrapper>) => (
  <EditorContext.Consumer>
    {({ engine }: EditorContextType) => (
      <Container initialState={INITIAL_STATE} actions={actions}>
        {({ range, onSelectRange }) => {
          const editor = (
            <EditorView
              file={file}
              openFiles={openFiles}
              onSelectFile={onSelectFile}
              onChangeProblems={onChangeProblems}
              range={range}
            />
          );

          return (
            <Wrapper {...props}>
              {previewEnabled ? (
                <StyledSplitPane
                  initialSize={0.5}
                  collapseRight={!previewOpen}
                  onExpandRight={onOpenPreview}
                  type="lr"
                  left={editor}
                  right={
                    <Wrapper>
                      <Preview />
                    </Wrapper>
                  }
                />
              ) : (
                editor
              )}
              <EditorToolbar
                file={file}
                onSelectRange={(path, selectedRange) => {
                  onSelectFile(engine.getFile(path));
                  onSelectRange(selectedRange);
                }}
              />
            </Wrapper>
          );
        }}
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
    onOpenPreview: () => dispatch(openPreview()),
  }),
)(EditorBase);
