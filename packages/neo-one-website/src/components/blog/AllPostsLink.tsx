import { Link } from '@neo-one/react-common';
import * as React from 'react';
import { as, Box, List, styled } from 'reakit';
import { prop } from 'styled-tools';
import { RouterLink } from '../RouterLink';

interface Props {
  readonly title: string;
  readonly path: string;
  readonly date: string;
  readonly author: string;
}

const PostLink = styled(as(RouterLink)(Link))`
  ${prop('theme.fontStyles.headline')};
`;

const PostInfo = styled(Box)`
  color: ${prop('theme.gray3')};
  ${prop('theme.fontStyles.subheading')};
`;

const Wrapper = styled(List)`
  list-style-type: none;
  max-width: 320px;
  border-bottom: 1px solid ${prop('theme.accent')};
`;

export const AllPostsLink = ({ title, path, date, author, ...props }: Props) => (
  <Wrapper {...props}>
    <PostLink to={path} linkColor="gray">
      {title}
    </PostLink>
    <PostInfo>{date}</PostInfo>
    <PostInfo>{`by ${author}`}</PostInfo>
  </Wrapper>
);
