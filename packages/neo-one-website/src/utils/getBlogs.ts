import * as fs from 'fs-extra';
import * as matter from 'gray-matter';
import * as path from 'path';
import { BlogAllProps, BlogProps } from '../components';

const BLOG_SOURCE = path.resolve(__dirname, '..', '..', 'blog');

interface MDBlogHeader {
  readonly title: string;
  readonly slug: string;
  readonly date: string;
  readonly author: string;
}

interface BlogInfo extends MDBlogHeader {
  readonly content: string;
}

export const getBlogs = async (): Promise<{
  readonly blogs: ReadonlyArray<BlogProps>;
  readonly blogAll: BlogAllProps;
}> => {
  const blogFiles = await fs.readdir(BLOG_SOURCE);

  const blogPosts = await Promise.all(blogFiles.map(async (blogFile) => getBlog(blogFile)));
  // tslint:disable-next-line:no-array-mutation
  const posts = blogPosts
    .map(({ title, slug, date, author }) => ({
      title,
      slug,
      date,
      author,
    }))
    .reverse();

  return {
    blogs: blogPosts.map((post) => ({
      current: post.slug,
      title: post.title,
      content: post.content,
      sidebar: [
        {
          title: 'RECENT POSTS',
          subsections: posts
            .map(({ title, slug }) => ({
              title,
              slug,
            }))
            .concat([
              {
                title: 'All posts ...',
                slug: '/blog/all',
              },
            ]),
        },
      ],
    })),
    blogAll: {
      posts,
    },
  };
};

const getBlog = async (blogFile: string): Promise<BlogInfo> => {
  const blog = matter.read(path.resolve(BLOG_SOURCE, blogFile));
  const blogHeader = blog.data as MDBlogHeader;

  return {
    slug: `/blog/${blogHeader.slug}`,
    title: blogHeader.title,
    date: blogHeader.date,
    author: blogHeader.author,
    content: blog.content,
  };
};
