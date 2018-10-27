import * as fs from 'fs-extra';
import * as path from 'path';
import { TutorialProps } from '../components';
import { SubsectionData } from '../types';

export interface SectionHeaders {
  readonly [key: string]: ReadonlyArray<string>;
}

const TUTORIAL_SOURCE = path.resolve(__dirname, '..', '..', 'tutorial', 'tutorial.md');

export const getTutorial = async (): Promise<TutorialProps> => {
  const content = await fs.readFile(TUTORIAL_SOURCE, 'utf-8');

  return {
    title: 'Tutorial: Intro to NEO•ONE',
    content,
    sidebar: [
      {
        title: 'TUTORIAL',
        subsections: parseSections(content),
      },
    ],
  };
};

const slugify = (title: string) => {
  const id = title.toLowerCase().replace(' ', '-');

  return `/tutorial#${id}`;
};

const parseSections = (tutorial: string): ReadonlyArray<SubsectionData> => {
  const sections = tutorial.split('\n').filter((line) => line.includes('##'));

  let prevHeader: string;

  const sectionHeaders = sections.reduce<SectionHeaders>((acc: SectionHeaders, section: string) => {
    const [level, ...headerItems] = section.split(' ');
    const header = headerItems.join(' ');

    let tempAcc;
    if (level === '##') {
      tempAcc = { [header]: [] };
      prevHeader = header;

      return { ...acc, ...tempAcc };
    }
    tempAcc = { [prevHeader]: [...acc[prevHeader], header] };

    return { ...acc, ...tempAcc };
  }, {});

  return Object.entries(sectionHeaders).map<SubsectionData>(([section, subsections]) => ({
    title: section,
    slug: slugify(section),
    subsections: subsections.map((subsection) => ({
      title: subsection,
      slug: slugify(subsection),
    })),
  }));
};
