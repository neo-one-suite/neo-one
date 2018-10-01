// tslint:disable no-any
import * as React from 'react';
import { Grid, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Console, FileType, Problems } from './toolbar';
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
  justify-content: start;
`;

interface Props {
  readonly file?: EditorFile;
  readonly files: EditorFiles;
  readonly onSelectRange: (file: EditorFile, range: TextRange) => void;
}

export const EditorToolbar = ({ file, files, onSelectRange, ...props }: Props) => (
  <Hidden.Container>
    {(hidden: any) => (
      <Wrapper>
        <Hidden {...hidden}>
          <Console files={files} onClose={hidden.toggle} onSelectRange={onSelectRange} />
        </Hidden>
        <ToolbarWrapper {...props}>
          <Problems onClick={hidden.toggle} />
          <FileType file={file} />
        </ToolbarWrapper>
      </Wrapper>
    )}
  </Hidden.Container>
);
