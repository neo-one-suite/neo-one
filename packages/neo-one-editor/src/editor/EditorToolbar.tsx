// tslint:disable no-any
import * as React from 'react';
import { connect } from 'react-redux';
import { Grid, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { selectConsoleOpen } from './redux';
import { BuildAction, Console, FileType, Problems, RunTestsAction } from './toolbar';
import { EditorFile, EditorFiles, TextRange } from './types';

const Wrapper = styled(Grid)`
  flex: 0 0 auto;
  width: 100%;
  grid:
    'console' auto
    'toolbar' auto
    / auto;
`;

const ToolbarWrapper = styled(Grid)`
  width: 100%;
  overflow-x: scroll;
  background-color: ${prop('theme.accent')};
  padding: 0 4px;
  gap: 8px;
  grid-auto-flow: column;
  justify-content: space-between;
`;

const ToolbarLeftWrapper = styled(Grid)`
  gap: 8px;
  grid-auto-flow: column;
  justify-content: start;
`;

const ToolbarRightWrapper = styled(Grid)`
  gap: 8px;
  grid-auto-flow: column;
  justify-content: end;
`;

interface Props {
  readonly file?: EditorFile;
  readonly files: EditorFiles;
  readonly onSelectRange: (file: EditorFile, range: TextRange) => void;
  readonly consoleOpen: boolean;
}

const EditorToolbarBase = ({ file, files, onSelectRange, consoleOpen, ...props }: Props) => (
  <Wrapper {...props}>
    <Hidden visible={consoleOpen}>
      <Console files={files} onSelectRange={onSelectRange} />
    </Hidden>
    <ToolbarWrapper>
      <ToolbarLeftWrapper>
        <Problems />
      </ToolbarLeftWrapper>
      <ToolbarRightWrapper>
        <FileType file={file} />
        <BuildAction />
        <RunTestsAction />
      </ToolbarRightWrapper>
    </ToolbarWrapper>
  </Wrapper>
);

export const EditorToolbar = connect(selectConsoleOpen)(EditorToolbarBase);
