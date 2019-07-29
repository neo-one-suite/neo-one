// tslint:disable no-null-keyword
import styled from '@emotion/styled';
import { Box, SplitPane } from '@neo-one/react-common';
import * as React from 'react';
import { connect } from 'react-redux';
import { EditorContext } from '../EditorContext';
import { Preview } from '../preview';
import { EditorContextType } from '../types';
import { EditorToolbar } from './EditorToolbar';
import { EditorView } from './EditorView';
import { EditorState, openPreview, selectPreviewEnabled, selectPreviewOpen, setFileProblems } from './redux';
import { EditorFile, EditorFiles, FileDiagnostic, TextRange } from './types';

const Wrapper = styled(Box)`
  display: flex;
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
  readonly range?: TextRange;
  readonly onSelectFile: (file?: EditorFile, range?: TextRange) => void;
  readonly openFiles: EditorFiles;
}

interface Props extends ExternalProps {
  readonly previewOpen: boolean;
  readonly previewEnabled: boolean;
  readonly onChangeProblems: (path: string, diagnostics: readonly FileDiagnostic[]) => void;
  readonly onOpenPreview: () => void;
}

const EditorBase = ({
  file,
  range,
  openFiles,
  previewOpen,
  previewEnabled,
  onSelectFile,
  onOpenPreview,
  onChangeProblems,
  ...props
}: Props & React.ComponentProps<typeof Wrapper>) => (
  <EditorContext.Consumer>
    {({ engine }: EditorContextType) => {
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
            onSelectRange={(path, textRange) => {
              onSelectFile(engine.getFile(path), textRange);
            }}
          />
        </Wrapper>
      );
    }}
  </EditorContext.Consumer>
);
export const Editor = connect(
  (state: EditorState) => ({
    ...selectPreviewOpen(state),
    ...selectPreviewEnabled(state),
  }),
  (dispatch) => ({
    // tslint:disable-next-line no-unnecessary-type-annotation
    onChangeProblems: (path: string, diagnostics: readonly FileDiagnostic[]) =>
      dispatch(setFileProblems({ path, problems: diagnostics })),
    onOpenPreview: () => dispatch(openPreview()),
  }),
)(EditorBase);
