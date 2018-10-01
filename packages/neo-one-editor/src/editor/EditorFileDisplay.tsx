import { basename } from '@neo-one/local-browser';
import * as React from 'react';
import { Grid, styled } from 'reakit';
import { EditorFileIcon } from './EditorFileIcon';
import { EditorFile } from './types';

const GridWrapper = styled(Grid)`
  grid-auto-flow: column;
  gap: 4px;
  align-items: start;
`;

const StyledEditorFileIcon = styled(EditorFileIcon)`
  height: 16px;
  width: 16px;
`;

interface Props {
  readonly file: EditorFile;
}

export const EditorFileDisplay = ({ file, ...props }: Props) => (
  <GridWrapper {...props}>
    <StyledEditorFileIcon file={file} />
    {`${basename(file.path)}${file.writable ? '' : ' (read-only)'}`}
  </GridWrapper>
);
