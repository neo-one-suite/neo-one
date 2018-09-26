import * as React from 'react';
import { connect } from 'react-redux';
import { Flex, styled } from 'reakit';
import { selectChapter } from '../redux';
import { Chapter, SelectedChapter } from '../types';
import { EditorFileTab } from './EditorFileTab';

const Wrapper = styled(Flex)`
  flex: 0 0 auto;
  flex-wrap: no-wrap;
  overflow-x: scroll;
`;

interface Props {
  readonly selected: SelectedChapter;
  readonly chapter: Chapter;
}

const EditorHeaderBase = ({ selected, chapter, ...props }: Props) => (
  <Wrapper {...props}>
    {chapter.files.map((file) => (
      <EditorFileTab key={file.path} selected={selected} file={file} />
    ))}
  </Wrapper>
);

export const EditorHeader = connect(selectChapter)(EditorHeaderBase);
