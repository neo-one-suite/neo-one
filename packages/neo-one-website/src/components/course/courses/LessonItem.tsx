import * as React from 'react';
import { as, Button, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { RouterLink } from '../../RouterLink';
import { getLessonTo, LessonProgressBar } from '../common';
import { Lesson } from '../types';

const Wrapper = styled(Grid)`
  grid-gap: 8px;
  grid:
    'title' auto
    'progress' auto
    / auto;
`;

const Title = styled(as(RouterLink)(Button))`
  width: 100%;
  ${prop('theme.fontStyles.headline')};
  ${prop('theme.fonts.axiformaMedium')};
  cursor: pointer;

  &&& {
    text-decoration: none;
  }

  &:hover {
    color: ${prop('theme.primaryDark')};
    text-decoration: none;
  }
`;

interface Props {
  readonly lesson: Lesson;
  readonly index: number;
  readonly slug: string;
}

export const LessonItem = ({ slug, lesson, index }: Props) => (
  <Wrapper>
    <Title to={getLessonTo(slug, index)} data-test={`${slug}-lesson-${index}`}>
      Lesson {index + 1}: {lesson.title}
    </Title>
    <LessonProgressBar slug={slug} index={index} lesson={lesson} />
  </Wrapper>
);
