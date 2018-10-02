// tslint:disable no-any
import * as React from 'react';
import { Grid, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { BuildAction, Console, FileType, Problems } from './toolbar';
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
}

export const EditorToolbar = ({ file, files, onSelectRange, ...props }: Props) => (
  <Hidden.Container>
    {(hidden: any) => (
      <Wrapper {...props}>
        <Hidden {...hidden}>
          <Console files={files} onClose={hidden.toggle} onSelectRange={onSelectRange} />
        </Hidden>
        <ToolbarWrapper>
          <ToolbarLeftWrapper>
            <Problems onClick={hidden.toggle} />
          </ToolbarLeftWrapper>
          <ToolbarRightWrapper>
            <FileType file={file} />
            <BuildAction file={file} />
          </ToolbarRightWrapper>
        </ToolbarWrapper>
      </Wrapper>
    )}
  </Hidden.Container>
);
