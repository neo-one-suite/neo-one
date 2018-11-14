import * as fs from 'fs-extra';
import matter from 'gray-matter';
import * as path from 'path';
import { Author, BlogAllProps, BlogProps, MarkdownContent } from '../components';

const BLOG_SOURCE = path.resolve(__dirname, '..', '..', 'blog');

interface MDBlogHeader {
  readonly title: string;
  readonly slug: string;
  readonly date: string;
  readonly author: string;
  readonly twitter: string;
}

interface BlogInfo {
  readonly title: string;
  readonly slug: string;
  readonly date: string;
  readonly content: MarkdownContent;
  readonly author: Author;
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

  const sidebar = [
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
  ];

  return {
    blogs: blogPosts.map((post) => ({
      current: post.slug,
      title: post.title,
      content: post.content,
      date: post.date,
      author: post.author,
      sidebar,
    })),
    blogAll: {
      posts,
    },
  };
};

const getBlog = async (blogFile: string): Promise<BlogInfo> => {
  const date = blogFile.slice(0, 10);
  const contents = await fs.readFile(path.resolve(BLOG_SOURCE, blogFile), 'utf8');
  const blog = matter(contents);
  const blogHeader = blog.data as MDBlogHeader;

  return {
    slug: `/blog/${blogHeader.slug}`,
    title: blogHeader.title,
    date,
    author: {
      name: blogHeader.author,
      twitter: blogHeader.twitter,
    },
    content: { type: 'markdown', value: blog.content },
  };
};
