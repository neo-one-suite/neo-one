// tslint:disable no-any
import { Button } from '@neo-one/react-common';
import * as React from 'react';
import { RouterLink } from '../../RouterLink';
import { getChapterTo } from '../common';
import { selectCourse, selectLesson } from '../coursesData';
import { Chapter, Lesson, SelectedChapter } from '../types';

interface Props {
  readonly selected: SelectedChapter;
  readonly onClick: () => void;
}

const getPreviousChapter = (selected: SelectedChapter) => {
  const lesson = selectLesson(selected);

  return lesson.chapters[selected.chapter - 1] as Chapter | undefined;
};

const getPreviousLesson = (selected: SelectedChapter) => {
  const course = selectCourse(selected);

  return course.lessons[selected.lesson - 1] as Lesson | undefined;
};

const ButtonLink = Button.withComponent(RouterLink);

export const PreviousButton = ({ selected, onClick, ...props }: Props) => {
  const previousChapter = getPreviousChapter(selected);
  const previousLesson = getPreviousLesson(selected);

  let to: string;
  if (previousChapter !== undefined) {
    to = getChapterTo(selected.course, selected.lesson, selected.chapter - 1);
  } else if (previousLesson !== undefined) {
    to = getChapterTo(selected.course, selected.lesson - 1, previousLesson.chapters.length - 1);
  } else {
    // tslint:disable-next-line no-null-keyword
    return null;
  }

  return (
    <ButtonLink {...props} data-test="previous-button" to={to} onClick={onClick}>
      Back
    </ButtonLink>
  );
};
