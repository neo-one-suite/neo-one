import path from 'path';

export interface Format {
  readonly browser: boolean;
  readonly dist: string;
  readonly name: string;
  readonly tsconfig: string;
  readonly tsconfigESM: string;
  readonly packageDir: string;
  readonly target: 'es2017' | 'esnext';
  readonly module: 'cjs' | 'esm';
}

const MAIN_FORMAT: Format = {
  target: 'es2017',
  module: 'cjs',
  browser: false,
  dist: 'cjs',
  name: '',
  packageDir: process.cwd(),
  tsconfig: path.resolve(__dirname, '../includes/build-configs/tsconfig.es2017.cjs.json'),
  tsconfigESM: path.resolve(__dirname, '../includes/build-configs/tsconfig.es2017.esm.json'),
};

const NEXT_FORMAT: Format = {
  target: 'esnext',
  module: 'esm',
  browser: false,
  dist: 'esm',
  name: 'esnext-esm',
  packageDir: process.cwd(),
  tsconfig: path.resolve(__dirname, '../includes/build-configs/tsconfig.esnext.esm.json'),
  tsconfigESM: path.resolve(__dirname, '../includes/build-configs/tsconfig.esnext.esm.json'),
};

export const getFormat = (requestedFormat: string) => {
  switch (requestedFormat) {
    case 'main':
      return MAIN_FORMAT;
    case 'next':
      return NEXT_FORMAT;
    default:
      throw new Error(`Invalid requested build format: ${requestedFormat}`);
  }
};
