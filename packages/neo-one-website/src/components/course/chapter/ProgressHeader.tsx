import * as React from 'react';
import { connect } from 'react-redux';
import { LessonProgressBar } from '../common';
import { selectLesson } from '../redux';
import { Lesson, SelectedChapter } from '../types';

interface Props {
  readonly selected: SelectedChapter;
  readonly lesson: Lesson;
}

const ProgressHeaderBase = ({ selected, lesson }: Props) => (
  <LessonProgressBar current={selected.chapter} slug={selected.course} index={selected.lesson} lesson={lesson} />
);

export const ProgressHeader = connect(selectLesson)(ProgressHeaderBase);
