import * as React from 'react';
import { connect } from 'react-redux';
import { Box, styled } from 'reakit';
import { selectChapterFile } from '../redux';
import { ChapterFile, SelectedChapter } from '../types';
import { MonacoEditor } from './MonacoEditor';

const Wrapper = styled(Box)`
  flex: 1 1 100%;
`;

interface Props {
  readonly selected: SelectedChapter;
  readonly file: ChapterFile;
}

const EditorViewBase = ({ selected: _selected, file, ...props }: Props) => (
  <Wrapper {...props}>
    <MonacoEditor
      file={{
        path: file.path,
        content: file.current === undefined ? file.solution : file.current,
      }}
      language={file.type === 'contract' ? 'typescript-smart-contract' : 'typescript'}
    />
  </Wrapper>
);

export const EditorView = connect(selectChapterFile)(EditorViewBase);
