// tslint:disable no-submodule-imports
import parser from 'prettier/parser-typescript';
import prettier from 'prettier/standalone';
import { FileResult } from './type';

const formatSingleFile = (value: string, browserify: boolean) => {
  const result = `// tslint:disable\n/* eslint-disable */\n${prettier.format(value, {
    arrowParens: 'always',
    parser: 'typescript',
    plugins: [parser],
    printWidth: 120,
    singleQuote: true,
    trailingComma: 'all',
  })}`;

  return browserify ? result.replace(/'@neo-one\/client'/gu, "'@neo-one/client-browserify'") : result;
};

export const formatFile = (value: FileResult, browserify: boolean): FileResult => ({
  js: value.js === undefined ? undefined : formatSingleFile(value.js, browserify),
  ts: formatSingleFile(value.ts, browserify),
});
