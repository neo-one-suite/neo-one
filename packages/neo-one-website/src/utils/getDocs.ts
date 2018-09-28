import * as fs from 'fs-extra';
import * as matter from 'gray-matter';
import * as path from 'path';

interface MDDocHeader {
  readonly title: string;
  readonly slug: string;
}

const DOCS_SOURCE = path.resolve(__dirname, '..', '..', 'docs');
const SECTION = 'section.md';

export const getDocs = async () => {
  const docDirs = await getDirectories(DOCS_SOURCE);

  return Promise.all(docDirs.map(async (dir) => getSection(dir)));
};

const getSection = async (sectionPath: string) => {
  const section = matter.read(path.resolve(sectionPath, SECTION));
  const sectionHeader = section.data as MDDocHeader;

  return {
    slug: sectionHeader.slug,
    section: section.content,
  };
};

const getDirectories = async (filePath: string): Promise<ReadonlyArray<string>> => {
  const paths = await fs.readdir(filePath);
  const pathAndDir = await Promise.all(
    paths.map(async (fileName) => {
      const file = path.resolve(filePath, fileName);
      const stat = await fs.stat(file);

      return { isDir: stat.isDirectory(), file };
    }),
  );

  return pathAndDir.filter(({ isDir }) => isDir).map(({ file }) => file);
};
