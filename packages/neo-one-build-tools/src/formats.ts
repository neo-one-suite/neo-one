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

export const MAIN_FORMAT: Format = {
  target: 'es2017',
  module: 'cjs',
  browser: false,
  dist: 'lib',
  name: '',
  packageDir: process.cwd(),
  tsconfig: path.resolve(__dirname, '../includes/build-configs/tsconfig.es2017.cjs.json'),
  tsconfigESM: path.resolve(__dirname, '../includes/build-configs/tsconfig.es2017.esm.json'),
};

export const NEXT_FORMAT: Format = {
  target: 'esnext',
  module: 'esm',
  browser: false,
  dist: 'next',
  name: 'esnext-esm',
  packageDir: process.cwd(),
  tsconfig: path.resolve(__dirname, '../includes/build-configs/tsconfig.esnext.esm.js'),
  tsconfigESM: path.resolve(__dirname, '../includes/build-configs/tsconfig.esnext.esm.js'),
};

export const BROWSER_FORMAT: Format = {
  target: 'es2017',
  module: 'cjs',
  browser: true,
  dist: 'browser',
  name: 'browserify',
  packageDir: process.cwd(),
  tsconfig: path.resolve(__dirname, '../includes/build-configs/tsconfig.es2017.browserify.cjs.json'),
  tsconfigESM: path.resolve(__dirname, '../includes/build-configs/tsconfig.es2017.esm.json'),
};
