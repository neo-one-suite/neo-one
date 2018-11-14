import * as React from 'react';
import { connect } from 'react-redux';
import { ProgressBar } from '../common';
import { ChaptersProgress, CourseState, selectLessonProgress } from '../redux';
import { Lesson } from '../types';
import { getChapterName, getChapterTo } from './utils';

interface ExternalProps {
  readonly slug: string;
  readonly index: number;
  readonly current?: number;
  readonly lesson: Lesson;
}

interface Props extends ExternalProps {
  readonly progress: ChaptersProgress;
}

const LessonProgressBarBase = ({ slug, index, current, lesson, progress }: Props) => (
  <ProgressBar
    current={current}
    items={lesson.chapters.map((chapter, idx) => ({
      complete: progress[idx],
      title: getChapterName(chapter.title, idx),
      to: getChapterTo(slug, index, idx),
    }))}
  />
);

export const LessonProgressBar = connect((state: CourseState, { slug, index }: ExternalProps) => ({
  progress: selectLessonProgress(state, { course: slug, lesson: index }),
}))(LessonProgressBarBase);
