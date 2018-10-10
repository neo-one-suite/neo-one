// tslint:disable no-any
import { Button } from '@neo-one/react';
import * as React from 'react';
import { Link } from 'react-static';
import { as } from 'reakit';
import { getChapterTo, getLessonTo } from '../common';
import { selectCourse, selectLesson } from '../coursesData';
import { Chapter, Lesson, SelectedChapter } from '../types';

interface Props {
  readonly selected: SelectedChapter;
}

const getNextChapter = (selected: SelectedChapter) => {
  const lesson = selectLesson(selected);

  return lesson.chapters[selected.chapter + 1] as Chapter | undefined;
};

const getNextLesson = (selected: SelectedChapter) => {
  const course = selectCourse(selected);

  return course.lessons[selected.lesson + 1] as Lesson | undefined;
};

const ButtonLink = as(Link)(Button);

export const NextButton = ({ selected, ...props }: Props) => {
  const nextChapter = getNextChapter(selected);
  const nextLesson = getNextLesson(selected);

  let to: string;
  let text: string;
  if (nextChapter !== undefined) {
    to = getChapterTo(selected.course, selected.lesson, selected.chapter + 1);
    text = 'Next Chapter';
  } else if (nextLesson !== undefined) {
    to = getLessonTo(selected.course, selected.lesson + 1);
    text = 'Next Lesson';
  } else {
    to = '/course';
    text = 'Complete Course';
  }

  return (
    <ButtonLink {...props} data-test="next-button" to={to}>
      {text}
    </ButtonLink>
  );
};
