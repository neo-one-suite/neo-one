export const indentString = (
  str: string,
  count = 1,
  {
    indent = ' ',
    includeEmptyLines = false,
  }: {
    readonly indent?: string;
    readonly includeEmptyLines?: boolean;
  } = { indent: ' ', includeEmptyLines: false },
) => {
  if (count === 0) {
    return str;
  }

  const regex = includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;

  return str.replace(regex, indent.repeat(count));
};

const ansiRegex = new RegExp(
  [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))',
  ].join('|'),
  'g',
);

export const stripAnsi = (input: string) => input.replace(ansiRegex, '');
