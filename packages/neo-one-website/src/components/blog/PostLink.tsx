import styled from '@emotion/styled';
import { Box, List } from '@neo-one/react-common';
import * as React from 'react';
import { prop } from 'styled-tools';
import { Author } from '../content';
import { StyledRouterLink } from '../StyledRouterLink';

interface Props {
  readonly title: string;
  readonly path: string;
  readonly date: string;
  readonly author: Author;
}

const StyledLink = styled(StyledRouterLink)`
  ${prop('theme.fontStyles.headline')};
`;

const PostInfo = styled(Box)`
  color: ${prop('theme.gray5')};
  ${prop('theme.fontStyles.subheading')};
`;

const Wrapper = styled(List)`
  list-style-type: none;
  max-width: 320px;
  border-bottom: 1px solid ${prop('theme.gray3')};
  padding-bottom: 16px;
`;

export const PostLink = ({ title, path, date, author, ...props }: Props) => (
  <Wrapper {...props}>
    <StyledLink to={path} linkColor="gray">
      {title}
    </StyledLink>
    <PostInfo>{date}</PostInfo>
    <PostInfo>{`by ${author.name}`}</PostInfo>
  </Wrapper>
);
