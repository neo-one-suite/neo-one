// tslint:disable no-submodule-imports
import parser from 'prettier/parser-typescript';
import prettier from 'prettier/standalone';
import { transform, Transform } from 'sucrase';

// tslint:disable-next-line readonly-array
const TRANSFORMS: Transform[] = ['typescript', 'imports', 'jsx'];

/**
 *  We format the transpiled code to workaround some issues with sucrase's transpilation of typescript types -
 *
 *    const foo = (): {
 *      bar: string;
 *    } => ({ bar: 'bar' });
 *
 *    To
 *
 *    const foo = ()
 *
 *    => ({ bar: 'bar' });
 *
 *  prettier's parser, however, seems to handle this correctly.
 */
const formatSingleFile = (value: string): string =>
  prettier.format(value, {
    arrowParens: 'always',
    parser: 'typescript',
    plugins: [parser],
    printWidth: 120,
    singleQuote: true,
    trailingComma: 'all',
  });

export const transpile = (path: string, value: string) => {
  const result = transform(value, {
    transforms: TRANSFORMS,
    filePath: path,
  });

  return formatSingleFile(result.code);
};
