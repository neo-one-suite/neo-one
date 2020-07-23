// tslint:disable no-null-keyword
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import { Box, prop } from '@neo-one/react-common';
import * as React from 'react';
import { Markdown } from '../../elements';
import { ReferenceContent } from '../reference';
import { ContentType } from './Content';
import { DateAndAuthor } from './DateAndAuthor';
import { EditPageLink } from './EditPageLink';
import { Author } from './types';

const Wrapper = styled(Box)`
  padding-top: 16px;
  padding-bottom: 16px;
  min-width: 0;

  @media (min-width: ${prop('theme.breakpoints.md')}) {
    padding-top: 64px;
    padding-bottom: 64px;
  }
`;

const smallHeaderMargins = css`
  margin-top: 16px;
  margin-bottom: 8px;
`;

const headerMargins = css`
  margin-top: 32px;
  margin-bottom: 24px;
`;

const StyledMarkdown = styled(Markdown)`
  ${prop('theme.fontStyles.body2')};
  ${prop('theme.fonts.axiformaBook')};
  color: ${prop('theme.black')};
  min-width: 0;

  & table {
    border-collapse: collapse;
  }
  & td, th {
    padding: 8px;
  }
  & th {
    border: 1px solid ${prop('theme.black')};
  }
  & td {
    border-left: 1px solid ${prop('theme.black')};
    border-right: 1px solid ${prop('theme.black')};
    border-top: 1px solid ${prop('theme.black')};
  }
  & th {
    border-top: none;
  }
  & th:last-child {
    border-right: none;
  }
  & th:first-child {
    border-left: none;
  }
  & td:first-child {
    border-left: none;
  }
  & td:last-child {
    border-right: none;
  }

  @media (min-width: ${prop('theme.breakpoints.md')}) {
    ${prop('theme.fontStyles.subheading')};
  }

  & h1 {
    ${prop('theme.fontStyles.display2')};
    margin-top: 16px;
    margin-bottom: 24px;

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.display3')};
    }
  }

  & h2 {
    ${prop('theme.fontStyles.headline')};
    ${smallHeaderMargins}

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.display1')};
      ${headerMargins}
    }
  }

  & h3 {
    ${prop('theme.fontStyles.headline')};
    ${smallHeaderMargins}

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.headline')};
      ${headerMargins}
    }
  }

  & h4 {
    ${prop('theme.fontStyles.body2')};
    ${smallHeaderMargins}

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.subheading')};
      ${headerMargins}
    }
  }

  & h5 {
    ${prop('theme.fontStyles.body2')};
    ${smallHeaderMargins}

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.subheading')};
      ${headerMargins}
    }
  }

  & > p {
    max-width: ${prop('theme.constants.content.maxWidth')};
  }

  & > ol {
    max-width: ${prop('theme.constants.content.maxWidth')};
  }

  & > ul {
    max-width: ${prop('theme.constants.content.maxWidth')};
  }

  & table {
    border: none;
    border-spacing: 0;
    overflow-x: auto;
    display: block;
  }

  & tr:nth-child(even) {
    background-color: ${prop('theme.gray2')};
  }

  & tr:nth-child(odd) {
    background-color: ${prop('theme.grayHalf')};
  }

  &&& > p:nth-child(1) {
    ${prop('theme.fonts.axiformaThin')};
    ${prop('theme.fontStyles.subheading')};
    color: ${prop('theme.gray6')};
    margin-bottom: 16px;
    margin-top: 16px;
    max-width: unset;

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.headline')};
      margin-bottom: 40px;
      margin-top: 40px;
    }
  }

  &&&& img {
    max-width: 100%;
  }

  &&&& p img {
    max-width: 100%;
  }
`;

const Title = styled.h1`
  margin-top: 16px;
  margin-bottom: 24px;
  margin-left: 0;
  margin-right: 0;
  ${prop('theme.fontStyles.display2')};
  color: ${prop('theme.black')};
  ${prop('theme.fonts.axiformaBook')};
  font-weight: 700;

  @media (min-width: ${prop('theme.breakpoints.md')}) {
    ${prop('theme.fontStyles.display3')};
  }
`;

interface Props {
  readonly title: string;
  readonly content: ContentType;
  readonly date?: string;
  readonly link: string;
  readonly author?: Author;
}

export const MainContent = ({ content, title, date, link, author, ...props }: Props) => (
  <Wrapper {...props}>
    <Title>{title}</Title>
    {date === undefined || author === undefined ? null : <DateAndAuthor date={date} author={author} />}
    {content.type === 'markdown' ? (
      <>
        <StyledMarkdown source={content.value} linkColor="accent" light anchors resetScroll />
        <EditPageLink link={link} />
      </>
    ) : (
      <ReferenceContent content={content} />
    )}
  </Wrapper>
);
