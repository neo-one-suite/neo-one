import { format } from 'prettier';

export const formatFile = (value: string) =>
  `// tslint:disable\n${format(value, {
    arrowParens: 'always',
    parser: 'typescript',
    printWidth: 120,
    singleQuote: true,
    trailingComma: 'all',
  })}`;
