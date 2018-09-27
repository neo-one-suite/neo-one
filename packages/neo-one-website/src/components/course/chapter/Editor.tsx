import * as React from 'react';
import { connect } from 'react-redux';
import { EditorFile, SimpleEditor } from '../../editor';
import { selectChapter, selectChapterFile, selectFile, State, updateFile } from '../redux';
import { ChapterFile, SelectedChapter } from '../types';

interface ExternalProps {
  readonly selected: SelectedChapter;
}

interface Props extends ExternalProps {
  readonly file: ChapterFile;
  readonly files: ReadonlyArray<ChapterFile>;
  readonly onChangeFile: (file: EditorFile) => void;
  readonly onSelectFile: (file: EditorFile) => void;
}

const getEditorFile = (file: ChapterFile): EditorFile => ({
  path: file.path,
  content: file.current === undefined ? file.solution : file.current,
  writable: file.current !== undefined,
  type: file.type,
});

const EditorBase = ({ selected: _selected, file, files, onChangeFile, onSelectFile, ...props }: Props) => (
  <SimpleEditor
    {...props}
    selectedFile={getEditorFile(file)}
    files={files.map(getEditorFile)}
    onChangeFile={onChangeFile}
    onSelectFile={onSelectFile}
  />
);

export const Editor = connect(
  (state: State, connectProps: ExternalProps) => ({
    file: selectChapterFile(state, connectProps).file,
    files: selectChapter(state, connectProps).chapter.files,
  }),
  (dispatch, { selected }) => ({
    // tslint:disable-next-line no-unnecessary-type-annotation
    onChangeFile: (file: EditorFile) =>
      dispatch(
        updateFile({
          ...selected,
          path: file.path,
          content: file.content,
        }),
      ),
    // tslint:disable-next-line no-unnecessary-type-annotation
    onSelectFile: (file: EditorFile) =>
      dispatch(
        selectFile({
          ...selected,
          path: file.path,
        }),
      ),
  }),
)(EditorBase);
