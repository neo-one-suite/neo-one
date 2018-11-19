// tslint:disable no-any
import { Button } from '@neo-one/react-common';
import * as React from 'react';
import { connect } from 'react-redux';
import { RouterLink } from '../../RouterLink';
import { getChapterTo, getLessonTo } from '../common';
import { selectCourse, selectLesson } from '../coursesData';
import { completeChapter } from '../redux';
import { Chapter, Lesson, SelectedChapter } from '../types';

interface Props {
  readonly selected: SelectedChapter;
  readonly complete: boolean;
  readonly onClick: () => void;
}

const getNextChapter = (selected: SelectedChapter) => {
  const lesson = selectLesson(selected);

  return lesson.chapters[selected.chapter + 1] as Chapter | undefined;
};

const getNextLesson = (selected: SelectedChapter) => {
  const course = selectCourse(selected);

  return course.lessons[selected.lesson + 1] as Lesson | undefined;
};

const ButtonLink = Button.withComponent(RouterLink);

const NextButtonBase = ({ selected, onClick, complete, ...props }: Props) => {
  const nextChapter = getNextChapter(selected);
  const nextLesson = getNextLesson(selected);

  let to: string;
  let text: string;
  if (nextChapter !== undefined) {
    to = getChapterTo(selected.course, selected.lesson, selected.chapter + 1);
    text = complete ? 'Next' : 'Skip';
  } else if (nextLesson !== undefined) {
    to = getLessonTo(selected.course, selected.lesson + 1);
    text = complete ? 'Next' : 'Skip';
  } else {
    to = '/course';
    text = complete ? 'Complete Course' : 'Skip';
  }

  return (
    <ButtonLink {...props} data-test="next-button" to={to} onClick={onClick}>
      {text}
    </ButtonLink>
  );
};

export const NextButton = connect(
  undefined,
  (dispatch, { selected, complete, onClick }: Props) => ({
    onClick: () => {
      if (!complete) {
        dispatch(completeChapter(selected));
      }
      onClick();
    },
  }),
)(NextButtonBase);
