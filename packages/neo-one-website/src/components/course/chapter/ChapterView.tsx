import * as React from 'react';
import { Grid, styled } from 'reakit';
import { SelectedChapter } from '../types';
import { Docs } from './Docs';
import { Editor } from './Editor';
import { ProgressHeader } from './ProgressHeader';

interface Props {
  readonly selected: SelectedChapter;
}

const StyledGrid = styled(Grid)`
  overflow: hidden;
  height: 100%;
  width: 100%;
  grid:
    'progress progress' 8px
    'docs editor' 1fr
    / minmax(560px, 2fr) 3fr;
`;

export const ChapterView = ({ selected }: Props) => (
  <StyledGrid>
    <Grid.Item area="progress">
      <ProgressHeader selected={selected} />
    </Grid.Item>
    <Docs selected={selected} />
    <Editor selected={selected} />
  </StyledGrid>
);
