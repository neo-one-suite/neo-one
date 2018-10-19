import { FullEditor } from '@neo-one/editor';
import * as React from 'react';
import { connect } from 'react-redux';
import { getChapterTo } from '../common';
import { selectChapter } from '../coursesData';
import { completeChapter } from '../redux';
import { SelectedChapter } from '../types';
import { enablePreview } from './utils';

interface ExternalProps {
  readonly selected: SelectedChapter;
}

interface Props extends ExternalProps {
  readonly onTestsPass: () => void;
}

const EditorBase = ({ selected, onTestsPass, ...props }: Props) => {
  const preview = enablePreview(selected);

  return (
    <FullEditor
      {...props}
      id={getChapterTo(selected.course, selected.lesson, selected.chapter)}
      createPreviewURL={() =>
        process.env.NODE_ENV === 'production' ? 'https://neo-one-course-preview.netlify.com' : `http://localhost:8080`
      }
      initialFiles={selectChapter(selected).files.map((file) => ({
        path: file.path,
        content: file.initial === undefined ? file.solution : file.initial,
        writable: file.initial !== undefined,
        open: true,
      }))}
      initialOptions={{
        preview: {
          enabled: preview,
          open: preview,
        },
      }}
      onTestsPass={onTestsPass}
    />
  );
};

export const Editor = connect(
  undefined,
  (dispatch, { selected }: ExternalProps) => ({
    onTestsPass: () => dispatch(completeChapter(selected)),
  }),
)(EditorBase);
