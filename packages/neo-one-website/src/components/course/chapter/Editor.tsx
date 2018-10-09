import { FullEditor } from '@neo-one/editor';
import * as React from 'react';
import { connect } from 'react-redux';
import { getChapterTo } from '../common';
import { selectChapter } from '../coursesData';
import { completeChapter } from '../redux';
import { SelectedChapter } from '../types';

interface ExternalProps {
  readonly selected: SelectedChapter;
}

interface Props extends ExternalProps {
  readonly onTestsPass: () => void;
}

const EditorBase = ({ selected, onTestsPass, ...props }: Props) => (
  <FullEditor
    {...props}
    id={getChapterTo(selected.course, selected.lesson, selected.chapter)}
    initialFiles={selectChapter(selected).files.map((file) => ({
      path: file.path,
      content: file.initial === undefined ? file.solution : file.initial,
      writable: file.initial !== undefined,
      open: true,
    }))}
    onTestsPass={onTestsPass}
  />
);

export const Editor = connect(
  undefined,
  (dispatch, { selected }: ExternalProps) => ({
    onTestsPass: () => dispatch(completeChapter(selected)),
  }),
)(EditorBase);
