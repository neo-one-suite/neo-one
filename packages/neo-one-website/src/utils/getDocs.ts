import * as fs from 'fs-extra';
import * as matter from 'gray-matter';
import * as path from 'path';

interface MDDocHeader {
  readonly title: string;
  readonly slug: string;
  readonly section: string;
}

interface DocInfoBase extends MDDocHeader {
  readonly doc: string;
}

export interface AdjacentInfo {
  readonly slug: string;
  readonly title: string;
}

interface DocInfo extends DocInfoBase {
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

const DOCS_SOURCE = path.resolve(__dirname, '..', '..', 'docs');
const DOC = 'doc.md';

export const getDocs = async (): Promise<ReadonlyArray<DocInfo>> => {
  const docDirs = await getDirectories(DOCS_SOURCE);

  const docs = await Promise.all(docDirs.map(async (dir) => getDoc(dir)));

  return getAdjacent(docs);
};

const getDoc = async (docPath: string): Promise<DocInfoBase> => {
  const doc = matter.read(path.resolve(docPath, DOC));
  const docHeader = doc.data as MDDocHeader;

  return {
    slug: docHeader.slug,
    title: docHeader.title,
    section: docHeader.section,
    doc: doc.content,
  };
};

const getAdjacent = (docs: ReadonlyArray<DocInfoBase>): ReadonlyArray<DocInfo> =>
  docs.map((doc, idx) => {
    let previous;
    let next;

    if (idx !== 0) {
      previous = {
        slug: docs[idx - 1].slug,
        title: docs[idx - 1].title,
      };
    }
    if (idx < docs.length - 1) {
      next = {
        slug: docs[idx + 1].slug,
        title: docs[idx + 1].title,
      };
    }

    return {
      ...doc,
      next,
      previous,
    };
  });

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
