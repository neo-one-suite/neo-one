import { format } from 'prettier';
import { FileResult } from './type';

const formatSingleFile = (value: string) =>
  `// tslint:disable\n/* eslint-disable */\n${format(value, {
    arrowParens: 'always',
    parser: 'typescript',
    printWidth: 120,
    singleQuote: true,
    trailingComma: 'all',
  })}`;
export const formatFile = (value: FileResult): FileResult => ({
  js: value.js === undefined ? undefined : formatSingleFile(value.js),
  ts: formatSingleFile(value.ts),
});
