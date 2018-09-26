import * as React from 'react';
import { connect } from 'react-redux';
import { styled } from 'reakit';
import { prop } from 'styled-tools';
import { Markdown } from '../common';
import { selectChapter } from '../redux';
import { Chapter } from '../types';

const StyledMarkdown = styled(Markdown)`
  border-right: 1px solid ${prop('theme.gray5')};
  background-color: ${prop('theme.black')};
  height: 100%;
`;

interface Props {
  readonly chapter: Chapter;
}

const DocsBase = ({ chapter }: Props) => <StyledMarkdown source={chapter.documentation} />;

export const Docs = connect(selectChapter)(DocsBase);
