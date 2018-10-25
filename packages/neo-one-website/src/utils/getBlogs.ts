import * as fs from 'fs-extra';
import * as matter from 'gray-matter';
import * as path from 'path';
import { SectionData, SubsectionData } from '../components';

const BLOG_SOURCE = path.resolve(__dirname, '..', '..', 'blog');

export interface MDBlogHeader extends SubsectionData {
  readonly date: string;
  readonly author: string;
}

interface MDBlogData extends MDBlogHeader {
  readonly content: string;
}

export interface BlogInfo {
  readonly slug: string;
  readonly content: string;
  readonly sidebar: ReadonlyArray<SectionData>;
}

export const getBlogs = async (): Promise<{
  readonly posts: ReadonlyArray<BlogInfo>;
  readonly allPosts: ReadonlyArray<MDBlogHeader>;
}> => {
  const blogFiles = await fs.readdir(BLOG_SOURCE);

  const blogPosts = await Promise.all(blogFiles.map(async (blogFile) => getBlog(blogFile)));
  // tslint:disable-next-line:no-array-mutation
  const sections = blogPosts
    .map(({ title, slug, date, author }) => ({
      title,
      slug,
      date,
      author,
    }))
    .reverse();

  return {
    posts: blogPosts.map((post) => ({
      slug: post.slug,
      content: post.content,
      sidebar: [
        {
          section: 'Recent Posts',
          subsections: sections.map(({ title, slug }) => ({
            title,
            slug,
          })),
        },
      ],
    })),
    allPosts: sections,
  };
};

const getBlog = async (blogFile: string): Promise<MDBlogData> => {
  const blog = matter.read(path.resolve(BLOG_SOURCE, blogFile));
  const blogHeader = blog.data as MDBlogHeader;

  return {
    slug: blogHeader.slug,
    title: blogHeader.title,
    date: blogHeader.date,
    author: blogHeader.author,
    content: blog.content,
  };
};
