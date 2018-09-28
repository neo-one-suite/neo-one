import * as React from 'react';
import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { EditorFile, TextRange } from '../types';
import { ConsoleContent } from './ConsoleContent';
import { ConsoleHeader } from './ConsoleHeader';

const Wrapper = styled(Grid)`
  width: 100%;
  grid:
    'header' auto
    'content' 240px
    / auto;
  border-top: 1px solid ${prop('theme.gray3')};
  background-color: ${prop('theme.gray6')};
`;

interface Props {
  readonly files: ReadonlyArray<EditorFile>;
  readonly onClose: () => void;
  readonly onSelectRange: (file: EditorFile, range: TextRange) => void;
}

export const Console = ({ files, onClose, onSelectRange, ...props }: Props) => (
  <Wrapper {...props}>
    <ConsoleHeader onCloseConsole={onClose} />
    <ConsoleContent files={files} onSelectRange={onSelectRange} />
  </Wrapper>
);
