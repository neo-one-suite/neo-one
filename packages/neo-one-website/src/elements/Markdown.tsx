/* @flow */
import MarkdownIt from 'markdown-it';
import * as React from 'react';
import { Box, css, styled } from 'reakit';
import { prop } from 'styled-tools';

export const mdOptions = {
  html: false,
  xhtmlOut: false,
  breaks: false,
  langPrefix: 'language-',
  linkify: true,
  typographer: true,
  quotes: `""''`,
};

const md = MarkdownIt().set(mdOptions);

const headerMargins = css`
  margin-top: 16px;
  margin-bottom: 16px;
`;

const Wrapper = styled(Box)`
  ${prop('theme.fontStyles.subheading')};
  overflow-wrap: break-word;

  & h1 {
    ${headerMargins};
    ${prop('theme.fontStyles.display1')};
  }

  & h2 {
    ${headerMargins};
    ${prop('theme.fontStyles.headline')};
  }

  & h3 {
    ${headerMargins};
    ${prop('theme.fontStyles.subheading')};
  }

  & h4 {
    ${headerMargins};
    ${prop('theme.fontStyles.body2')};
  }

  & h5 {
    ${headerMargins};
    ${prop('theme.fontStyles.body1')};
  }

  & h6 {
    ${headerMargins};
    ${prop('theme.fontStyles.body1')};
  }

  & p {
    margin-bottom: 8px;
    margin-top: 8px;
  }

  & a {
    color: ${prop('theme.accent')};
    text-decoration: none;
  }

  & hr {
    border: 'none';
    border-bottom: 1px solid rgba(255, 255, 255, 0.075);
    margin-bottom: 8px;
    margin-top: 8px;
  }

  & strong: {
    font-weight: ${prop('theme.fontStyles.axiformaMedium')};
  }

  & blockquote {
    border-left: 5px solid rgba(255, 255, 255, 0.12);
    margin-bottom: 16px;
    margin-left: 0;
    margin-right: 24px;
    margin-top: 16px;
    padding-left: 16px;
  }

  & ul {
    margin-bottom: 8px;
    margin-top: 8px;
    padding-left: 24px;
  }

  ,
  & ol {
    margin-bottom: 8px;
    margin-top: 8px;
    padding-left: 24px;
  }

  & pre {
    margin-bottom: 16px;
    margin-top: 16px;
    white-space: pre-wrap;
  }
`;

interface Props {
  readonly source: string;
}
export const Markdown = ({ source, ...props }: Props) => (
  <Wrapper {...props} dangerouslySetInnerHTML={{ __html: md.render(source) }} />
);
