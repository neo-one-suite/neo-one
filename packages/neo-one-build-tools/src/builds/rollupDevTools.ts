import path from 'path';
import { rollup } from 'rollup';
// @ts-ignore
import rollupString from 'rollup-plugin-string';
// tslint:disable-next-line: match-default-export-name
import rollupTypescript from 'rollup-plugin-typescript2';
import { Format } from '../formats';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

export const rollupDevTools = (format: Format) => async () => {
  const bundle = await rollup({
    input: path.join(APP_ROOT_DIR, 'neo-one-developer-tools', 'src', 'index.ts'),
    external: ['resize-observer-polyfill'],
    plugins: [
      rollupString.string({
        include: path.join(APP_ROOT_DIR, 'neo-one-developer-tools-frame', 'lib', 'tools.raw.js'),
      }),
      rollupTypescript({
        cacheRoot: path.join('node_modules', '.cache', 'rts2', format.target, format.module),
        tsconfig: format.tsconfigESM,
        tsconfigOverride: {
          compilerOptions: {
            inlineSources: false,
            declaration: false,
          },
        },
        check: false,
      }),
    ],
  });

  await bundle.write({
    format: format.module,
    file: path.join('lib', 'index.js'),
  });
};
