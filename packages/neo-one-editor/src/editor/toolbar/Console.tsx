import * as React from 'react';
import { Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { TextRange } from '../types';
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
  readonly onSelectRange: (path: string, range: TextRange) => void;
}

export const Console = ({ onSelectRange, ...props }: Props) => (
  <Wrapper {...props}>
    <ConsoleHeader />
    <ConsoleContent onSelectRange={onSelectRange} />
  </Wrapper>
);
