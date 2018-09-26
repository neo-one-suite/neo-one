import * as React from 'react';
import { Grid, styled } from 'reakit';
import { SelectedChapter } from '../types';
import { EditorHeader } from './EditorHeader';
import { EditorView } from './EditorView';

const Wrapper = styled(Grid)`
  width: 100%;
  height: 100%;
  grid:
    'header' auto
    'editor' 1fr
    / auto;
`;

interface Props {
  readonly selected: SelectedChapter;
}

export const Editor = ({ selected, ...props }: Props) => (
  <Wrapper {...props}>
    <EditorHeader selected={selected} />
    <EditorView selected={selected} />
  </Wrapper>
);
