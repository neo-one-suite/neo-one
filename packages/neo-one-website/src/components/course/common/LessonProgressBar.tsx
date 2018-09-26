import * as React from 'react';
import { ProgressBar } from '../common';
import { Lesson } from '../types';
import { getChapterName, getChapterTo } from './utils';

interface Props {
  readonly current?: number;
  readonly slug: string;
  readonly index: number;
  readonly lesson: Lesson;
}

export const LessonProgressBar = ({ slug, index, current, lesson }: Props) => (
  <ProgressBar
    current={current}
    items={lesson.chapters.map((chapter, idx) => ({
      complete: chapter.complete,
      title: getChapterName(chapter.title, idx),
      to: getChapterTo(slug, index, idx),
    }))}
  />
);
