import * as fs from 'fs-extra';
import * as matter from 'gray-matter';
import _ from 'lodash';
import * as path from 'path';
import { DocsProps } from '../components';
import { AdjacentInfo } from '../types';

interface MDDocHeader {
  readonly title: string;
  readonly slug: string;
  readonly section: string;
}

interface DocInfoBase extends MDDocHeader {
  readonly content: string;
}

interface DocInfo extends DocInfoBase {
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

const DOCS_SOURCE = path.resolve(__dirname, '..', '..', 'docs');

export const getDocs = async (): Promise<ReadonlyArray<DocsProps>> => {
  const docFiles = await fs.readdir(DOCS_SOURCE);

  const docsBare = await Promise.all(docFiles.map(async (dir) => getDoc(dir)));
  const docs = addAdjacent(docsBare);
  const sidebar = Object.entries(
    _.groupBy(
      docs.map((document) => ({
        title: document.title,
        slug: document.slug,
        section: document.section,
      })),
      (obj) => obj.section,
    ),
  ).map(([section, subsections]) => ({
    title: section,
    subsections: subsections.map((subsection) => ({
      title: subsection.title,
      slug: subsection.slug,
    })),
  }));

  return docs.map((doc) => ({
    current: doc.slug,
    title: doc.title,
    content: doc.content,
    sidebar,
    next: doc.next,
    previous: doc.previous,
  }));
};

const getDoc = async (docFile: string): Promise<DocInfoBase> => {
  const doc = matter.read(path.resolve(DOCS_SOURCE, docFile));
  const docHeader = doc.data as MDDocHeader;

  return {
    slug: `/docs/${docHeader.slug}`,
    title: docHeader.title,
    section: docHeader.section,
    content: doc.content,
  };
};

const addAdjacent = (docs: ReadonlyArray<DocInfoBase>): ReadonlyArray<DocInfo> =>
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
