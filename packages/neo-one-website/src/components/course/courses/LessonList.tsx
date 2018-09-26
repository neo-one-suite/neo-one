import * as React from 'react';
import { Box, styled } from 'reakit';
import { Lesson } from '../types';
import { LessonItem } from './LessonItem';

const Wrapper = styled(Box)`
  display: grid;
  grid-gap: 8px;
`;

interface Props {
  readonly slug: string;
  readonly lessons: ReadonlyArray<Lesson>;
}
export const LessonList = ({ slug, lessons, ...props }: Props) => (
  <Wrapper {...props}>
    {lessons.map((lesson, idx) => (
      <LessonItem key={idx} slug={slug} index={idx} lesson={lesson} />
    ))}
  </Wrapper>
);
