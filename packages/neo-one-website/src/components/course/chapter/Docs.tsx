import * as React from 'react';
import { styled } from 'reakit';
import { prop } from 'styled-tools';
import { Markdown } from '../common';
import { selectChapter } from '../coursesData';
import { SelectedChapter } from '../types';

const StyledMarkdown = styled(Markdown)`
  border-right: 1px solid ${prop('theme.gray5')};
  background-color: ${prop('theme.black')};
  min-height: 0;
  overflow-y: scroll;
`;

interface Props {
  readonly selected: SelectedChapter;
}

export const Docs = ({ selected }: Props) => <StyledMarkdown source={selectChapter(selected).documentation} />;
