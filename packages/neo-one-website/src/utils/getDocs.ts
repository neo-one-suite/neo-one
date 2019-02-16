import * as fs from 'fs-extra';
import matter from 'gray-matter';
import _ from 'lodash';
import * as path from 'path';
import { DocsProps, MarkdownContent } from '../components';
import { AdjacentInfo } from '../types';

interface MDDocHeader {
  readonly title: string;
  readonly slug: string;
  readonly section: string;
}

interface DocInfoBase extends MDDocHeader {
  readonly content: MarkdownContent;
  readonly link: string;
}

interface DocInfo extends DocInfoBase {
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

interface DocSectionConfig {
  readonly title: string;
  readonly numbered: boolean;
}

const DOCS_SOURCE = path.resolve(__dirname, '..', '..', 'docs');

export const getDocs = async (): Promise<ReadonlyArray<DocsProps>> => {
  const docSections = await fs.readdir(DOCS_SOURCE);
  const [docFileLists, docSectionConfigs] = await Promise.all([
    Promise.all(docSections.map(getDocSection)),
    getDocSectionConfigs(docSections),
  ]);
  const docsBare = _.flatten(docFileLists);
  const docs = addAdjacent(docsBare);

  return docs.map((doc) => ({
    current: doc.slug,
    title: doc.title,
    content: doc.content,
    link: doc.link,
    sidebar: Object.entries(
      _.groupBy(
        docs.map((document) => ({
          title: document.title,
          slug: document.slug,
          section: document.section,
        })),
        (obj) => obj.section,
      ),
    ).map(([section, subsections]) => ({
      ...docSectionConfigs[section],
      subsections: subsections.map((subsection) => ({
        title: subsection.title,
        slug: subsection.slug,
      })),
    })),
    next: doc.next,
    previous: doc.previous,
  }));
};

const getDocSection = async (section: string): Promise<ReadonlyArray<DocInfoBase>> => {
  const source = path.resolve(DOCS_SOURCE, section);
  const docFiles = await fs.readdir(source);

  return Promise.all(
    docFiles.filter((file) => file !== 'config.json').map(async (file) => getDoc(section, path.resolve(source, file))),
  );
};

const getDoc = async (section: string, docFile: string): Promise<DocInfoBase> => {
  const contents = await fs.readFile(docFile, 'utf8');
  const doc = matter(contents);
  const docHeader = doc.data as MDDocHeader;
  const docSource = path.resolve(__dirname, '..', '..', 'docs', docFile);
  const link = docSource.replace(path.resolve(__dirname, '..', '..', '..', '..'), '');

  return {
    slug: `/docs/${docHeader.slug}`,
    title: docHeader.title.replace(/\\@/g, '@'),
    section,
    content: { type: 'markdown', value: doc.content },
    link,
  };
};

const getDocSectionConfigs = async (
  sections: ReadonlyArray<string>,
): Promise<{ readonly [section: string]: DocSectionConfig }> => {
  const pairs = await Promise.all(
    sections.map(async (section) => {
      const config = await getDocSectionConfig(section);

      return [section, config];
    }),
  );

  return _.fromPairs(pairs);
};

const getDocSectionConfig = async (section: string): Promise<DocSectionConfig> => {
  const contents = await fs.readFile(path.resolve(DOCS_SOURCE, section, 'config.json'), 'utf8');

  return JSON.parse(contents);
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
