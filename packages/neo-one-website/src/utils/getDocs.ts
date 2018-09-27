import * as fs from 'fs-extra';
import * as path from 'path';

const DOCS_SOURCE = path.resolve(__dirname, '..', '..', 'docs');
const CONFIG = 'config.json';
const SECTION = 'section.md';

export const getDocs = async () => {
  const docDirs = await getDirectories(DOCS_SOURCE);

  return Promise.all(docDirs.map(async (dir) => getSection(dir)));
};

const getSection = async (sectionPath: string) => {
  const [section, config] = await Promise.all([
    fs.readFile(path.resolve(sectionPath, SECTION), 'utf-8'),
    fs.readFile(path.resolve(sectionPath, CONFIG), 'utf-8'),
  ]);
  const configParsed = JSON.parse(config);

  return {
    title: configParsed.title,
    slug: configParsed.slug,
    section,
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
