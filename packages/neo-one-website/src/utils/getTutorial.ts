import * as fs from 'fs-extra';
import * as path from 'path';

export interface SectionHeaders {
  readonly [key: string]: ReadonlyArray<string>;
}

export interface TutorialInfo {
  readonly tutorial: string;
  readonly sections: SectionHeaders;
}

const TUTORIAL_SOURCE = path.resolve(__dirname, '..', '..', 'tutorial', 'tutorial.md');

export const getTutorial = async (): Promise<TutorialInfo> => {
  const tutorial = await fs.readFile(TUTORIAL_SOURCE, 'utf-8');

  return {
    tutorial,
    sections: parseSections(tutorial),
  };
};

const parseSections = (tutorial: string): SectionHeaders => {
  const sections = tutorial.split('\n').filter((line) => line.includes('##'));

  let prevHeader: string;

  return sections.reduce<SectionHeaders>((acc: SectionHeaders, section: string) => {
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
};
