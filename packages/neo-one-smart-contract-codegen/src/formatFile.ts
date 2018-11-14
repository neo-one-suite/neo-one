// tslint:disable no-submodule-imports
import parser from 'prettier/parser-typescript';
import prettier from 'prettier/standalone';
import { FileResult } from './type';

const formatSingleFile = (value: string) =>
  `// tslint:disable\n/* eslint-disable */\n${prettier.format(value, {
    arrowParens: 'always',
    parser: 'typescript',
    plugins: [parser],
    printWidth: 120,
    singleQuote: true,
    trailingComma: 'all',
  })}`;
export const formatFile = (value: FileResult): FileResult => ({
  js: value.js === undefined ? undefined : formatSingleFile(value.js),
  ts: formatSingleFile(value.ts),
});
