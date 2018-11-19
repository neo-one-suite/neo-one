import { Box, SplitPane } from '@neo-one/react-common';
import { Redirect } from '@reach/router';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { getChapterTo } from '../common';
import { selectChapter } from '../coursesData';
import { ChaptersProgress, CourseState, selectLessonProgress } from '../redux';
import { SelectedChapter } from '../types';
import { Docs } from './Docs';
import { Editor } from './Editor';
import { ProgressHeader } from './ProgressHeader';
import { enablePreview } from './utils';

interface ExternalProps {
  readonly selected: SelectedChapter;
}

interface Props extends ExternalProps {
  readonly progress: ChaptersProgress;
}

const StyledGrid = styled(Box)`
  display: grid;
  overflow: hidden;
  height: calc(100vh - 56px);
  width: 100%;
  grid:
    'progress' 8px
    'pane' 1fr
    / 100%;
`;

const ProgressItem = styled(Box)`
  grid-area: progress;
`;

const ChapterViewBase = ({ selected, progress }: Props) => {
  const previousComplete = selected.chapter === 0 || progress[selected.chapter - 1];
  if (!previousComplete) {
    const chapter =
      Object.keys(progress).length === 0
        ? 0
        : Math.max(...Object.keys(progress).map((value) => parseInt(value, 10))) + 1;

    return <Redirect to={getChapterTo(selected.course, selected.lesson, chapter)} />;
  }

  return (
    <StyledGrid>
      <Helmet>
        <title>
          {`Lesson ${selected.lesson + 1} Chapter ${selected.chapter + 1}: ${selectChapter(selected).title} - NEO•ONE`}
        </title>
      </Helmet>
      <ProgressItem>
        <ProgressHeader selected={selected} />
      </ProgressItem>
      <SplitPane
        initialSize={enablePreview(selected) ? 0.33 : 0.4}
        type="lr"
        left={<Docs selected={selected} />}
        right={<Editor selected={selected} />}
      />
    </StyledGrid>
  );
};

export const ChapterView = connect((state: CourseState, { selected }: ExternalProps) => ({
  progress: selectLessonProgress(state, selected),
}))(ChapterViewBase);
