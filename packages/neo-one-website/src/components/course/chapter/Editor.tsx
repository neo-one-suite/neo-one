import { FullEditor } from '@neo-one/editor';
import * as React from 'react';
import { getChapterTo } from '../common';
import { selectChapter } from '../coursesData';
import { SelectedChapter } from '../types';

interface Props {
  readonly selected: SelectedChapter;
}

export const Editor = ({ selected, ...props }: Props) => (
  <FullEditor
    {...props}
    id={getChapterTo(selected.course, selected.lesson, selected.chapter)}
    initialFiles={selectChapter(selected).files.map((file) => ({
      path: file.path,
      content: file.initial === undefined ? file.solution : file.initial,
      writable: file.initial !== undefined,
      open: true,
    }))}
  />
);
