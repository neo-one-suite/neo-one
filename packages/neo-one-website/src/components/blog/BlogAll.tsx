import styled from '@emotion/styled';
import { Box } from '@neo-one/react-common';
import * as React from 'react';
import { prop } from 'styled-tools';
import { Author } from '../content';
import { PostLink } from './PostLink';

interface BlogPost {
  readonly slug: string;
  readonly title: string;
  readonly date: string;
  readonly author: Author;
}

export interface BlogAllProps {
  readonly posts: readonly BlogPost[];
}

const PostsGrid = styled(Box)<{}, {}>`
  display: grid;
  border-top: 1px solid ${prop('theme.gray3')};
  grid-template-columns: 1fr;
  margin-left: -8px;
  margin-right: -8px;
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 8px;
  grid-gap: 8px;

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    grid-template-columns: 1fr 1fr;
    grid-gap: 16px;
  }

  @media (min-width: ${prop('theme.breakpoints.md')}) {
    grid-template-columns: 1fr 1fr 1fr;
    margin-left: -16px;
    margin-right: -16px;
    padding-left: 16px;
    padding-right: 16px;
    padding-top: 24px;
    grid-gap: 24px;
  }
`;

const Title = styled(Box)<{}, {}>`
  ${prop('theme.fontStyles.display2')};
  margin-bottom: 16px;

  @media (min-width: ${prop('theme.breakpoints.sm')}) {
    margin-bottom: 24px;
  }

  @media (min-width: ${prop('theme.breakpoints.md')}) {
    ${prop('theme.fontStyles.display3')};
    margin-bottom: 32px;
  }
`;

const Wrapper = styled(Box)<{}, {}>`
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 16px;
  padding-bottom: 16px;
  width: 100%;

  @media (min-width: ${prop('theme.breakpoints.md')}) {
    width: 90%;
    padding-top: 64px;
    padding-bottom: 64px;
  }

  @media (min-width: ${prop('theme.breakpoints.lg')}) {
    max-width: 1280px;
  }
`;

const InnerWrapper = styled(Box)`
  display: grid;
  justify-items: center;
`;

export const BlogAll = ({ posts, ...props }: BlogAllProps) => (
  <Wrapper {...props}>
    <InnerWrapper>
      <Box>
        <Title>All Posts</Title>

        <PostsGrid>
          {posts.map((post) => (
            <PostLink key={post.slug} path={post.slug} title={post.title} author={post.author} date={post.date} />
          ))}
        </PostsGrid>
      </Box>
    </InnerWrapper>
  </Wrapper>
);
