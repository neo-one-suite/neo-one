import * as React from 'react';
import { Box, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { MDBlogHeader } from '../../utils';
import { AllPostsLink } from './AllPostsLink';

interface Props {
  readonly posts: ReadonlyArray<MDBlogHeader>;
}

const PostsGrid = styled(Grid)`
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 24px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-template-columns: 1fr;
  }
`;

const Title = styled(Box)`
  ${prop('theme.fontStyles.display3')};
  margin-bottom: 64px;
  border-bottom: 1px solid ${prop('theme.accent')};
`;

const Wrapper = styled(Grid)`
  justify-items: center;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 64px;
  padding-bottom: 64px;
  width: 90%;
`;

export const AllPosts = ({ posts, ...props }: Props) => (
  <Wrapper {...props}>
    <Title>All Posts</Title>
    <PostsGrid>
      {posts.map((post) => {
        const path = `/blog/${post.slug}`;

        return <AllPostsLink path={path} title={post.title} author={post.author} date={post.date} />;
      })}
    </PostsGrid>
  </Wrapper>
);
