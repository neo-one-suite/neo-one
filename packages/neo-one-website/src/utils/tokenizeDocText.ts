const PUNCTUATION: ReadonlyArray<[RegExp, string]> = [
  [/\./g, '.'],
  [/,/g, ','],
  [/\(/g, '('],
  [/\)/g, ')'],
  [/\[/g, '['],
  [/]/g, ']'],
  [/{/g, '{'],
  [/}/g, '}'],
  [/</g, '<'],
  [/>/g, '>'],
];

export interface ModuleLinksPaths {
  readonly links: ReadonlyArray<string>;
  readonly paths: ReadonlyArray<string>;
}

export interface ModuleLinks {
  readonly [moduleName: string]: ModuleLinksPaths;
}

const findLink = (word: string, links: ModuleLinks): string | undefined => {
  const foundLink = Object.entries(links).find((moduleLinks) => moduleLinks[1].links.includes(word));

  return foundLink === undefined ? undefined : foundLink[0];
};

const removeQuotes = (word: string) => (word.charAt(0) === '`' ? word.replace('`', '').replace('`', '') : word);

const tokenizeText = (text: string, links: ModuleLinks) => {
  const puncText = PUNCTUATION.reduce(
    (acc, [markRegExp, markString]) => acc.replace(markRegExp, ` ${markString} `),
    text,
  );

  return puncText.split(' ').map((word) => {
    const rawWord = removeQuotes(word);
    const foundModule = findLink(rawWord, links);

    return foundModule === undefined
      ? { value: rawWord }
      : { slug: `reference/${foundModule}/${rawWord.toLowerCase()}`, value: rawWord };
  });
};

export const tokenizeDocText = (textArray: ReadonlyArray<string>, links: ModuleLinks) =>
  textArray.map((line) => tokenizeText(line, links));
