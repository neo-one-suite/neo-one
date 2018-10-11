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

export const getDocs = async (): Promise<ReadonlyArray<DocInfo>> => {
  const docFiles = await fs.readdir(DOCS_SOURCE);

  const docs = await Promise.all(docFiles.map(async (dir) => getDoc(dir)));

  return getAdjacent(docs);
};

const getDoc = async (docFile: string): Promise<DocInfoBase> => {
  const doc = matter.read(path.resolve(DOCS_SOURCE, docFile));
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
