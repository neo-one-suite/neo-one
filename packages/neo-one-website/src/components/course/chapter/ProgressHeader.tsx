import * as React from 'react';
import { LessonProgressBar } from '../common';
import { selectLesson } from '../coursesData';
import { SelectedChapter } from '../types';

interface Props {
  readonly selected: SelectedChapter;
}

export const ProgressHeader = ({ selected }: Props) => (
  <LessonProgressBar
    current={selected.chapter}
    slug={selected.course}
    index={selected.lesson}
    lesson={selectLesson(selected)}
  />
);
