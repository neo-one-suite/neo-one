const PUNCTUATION: ReadonlyArray<readonly [RegExp, string]> = [
  [/\./gm, '.'] as const,
  [/,/gm, ','] as const,
  [/\(/gm, '('] as const,
  [/\)/gm, ')'] as const,
  [/\[/gm, '['] as const,
  [/]/gm, ']'] as const,
  [/{/gm, '{'] as const,
  [/}/gm, '}'] as const,
  [/</gm, '<'] as const,
  [/>/gm, '>'] as const,
  [/;/gm, ';'] as const,
  [/:/gm, ':'] as const,
];

const BASE_PATH = 'https://neo-one.io';

export interface ModuleLinksPaths {
  readonly links: readonly string[];
  readonly paths: readonly string[];
}

export interface ModuleLinks {
  readonly [moduleName: string]: ModuleLinksPaths;
}

const findLink = (word: string, links: ModuleLinks, moduleName: string): string | undefined => {
  let foundLinkInModule;
  if (Object.keys(links).includes(moduleName)) {
    foundLinkInModule = links[moduleName].links.includes(word) ? moduleName : undefined;
  }
  const foundLink =
    foundLinkInModule === undefined
      ? Object.entries(links).find((moduleLinks) => moduleLinks[1].links.includes(word))
      : [foundLinkInModule];

  return foundLink === undefined ? undefined : foundLink[0];
};

const removeQuotes = (word: string) => (word.charAt(0) === '`' ? word.replace('`', '').replace('`', '') : word);

const handleInlineLinks = (
  text: string,
  links: readonly string[] = [],
): { readonly linkText: string; readonly inlineLinks: readonly string[] } => {
  if (text.includes(BASE_PATH)) {
    const start = text.indexOf('[');
    const end = text.indexOf(']');
    const linkStart = text.indexOf(BASE_PATH) + BASE_PATH.length;
    const linkEnd = text.indexOf(')', linkStart);

    const linkText = `${text.substr(0, start)}${text
      .substr(start + 1, end - 1 - start)
      .replace(/ /g, '_')}_${text.substr(linkEnd + 1)}`;
    const inlineLinks = [text.substr(linkStart, linkEnd - linkStart)];

    return handleInlineLinks(linkText, links.concat(inlineLinks));
  }

  return {
    linkText: text,
    inlineLinks: links,
  };
};

const tokenizeText = (text: string, links: ModuleLinks, moduleName: string) => {
  const { linkText, inlineLinks } = handleInlineLinks(text);
  let inlineLinkCount = 0;

  const puncText = PUNCTUATION.reduce(
    (acc, [markRegExp, markString]) => acc.replace(markRegExp, ` ${markString} `),
    linkText,
  );

  return puncText.split(' ').map((word) => {
    const rawWord = removeQuotes(word);
    const foundModule = findLink(rawWord, links, moduleName);

    if (foundModule === undefined) {
      if (rawWord.includes('_') && inlineLinkCount !== inlineLinks.length) {
        inlineLinkCount += 1;

        return {
          slug: inlineLinks[inlineLinkCount - 1],
          value: rawWord.replace(/_/g, ' ').substr(0, rawWord.length - 1),
        };
      }

      return { value: rawWord };
    }

    return { slug: `/reference/${foundModule}/${rawWord.toLowerCase()}`, value: rawWord };
  });
};

export const tokenizeDocText = (textArray: readonly string[], links: ModuleLinks, moduleName: string) =>
  tokenizeText(textArray.slice(0, textArray.length - 1).join(' \n'), links, moduleName);
