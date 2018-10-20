// tslint:disable no-submodule-imports no-import-side-effect
// @ts-ignore
import babelPluginProposalAsyncGeneratorFunctions from '@babel/plugin-proposal-async-generator-functions';
// @ts-ignore
import babelPluginProposalNumericSeparator from '@babel/plugin-proposal-numeric-separator';
// @ts-ignore
import babelPluginProposalObjectRestSprerad from '@babel/plugin-proposal-object-rest-spread';
// @ts-ignore
import babelPluginTransformModulesCommonJS from '@babel/plugin-transform-modules-commonjs';
// @ts-ignore
import babelPluginTransformTypeScript from '@babel/plugin-transform-typescript';
// @ts-ignore
import babelPresetReact from '@babel/preset-react';
// @ts-ignore
import * as Babel from '@babel/standalone';
import { RawSourceMap } from 'source-map';

// tslint:disable-next-line no-let
let initialized = false;
const initialize = () => {
  if (initialized) {
    return;
  }
  initialized = true;

  Babel.registerPreset('@babel/preset-react', babelPresetReact);
  Babel.registerPlugin('@babel/plugin-proposal-object-rest-spread', babelPluginProposalObjectRestSprerad);
  Babel.registerPlugin('@babel/plugin-proposal-async-generator-functions', babelPluginProposalAsyncGeneratorFunctions);
  Babel.registerPlugin('@babel/plugin-proposal-numeric-separator', babelPluginProposalNumericSeparator);
  Babel.registerPlugin('@babel/plugin-transform-typescript', babelPluginTransformTypeScript);
  Babel.registerPlugin('@babel/plugin-transform-modules-commonjs', babelPluginTransformModulesCommonJS);
};

export interface TranspileResult {
  readonly code: string;
  readonly sourceMap: RawSourceMap;
}

export const transpile = (path: string, value: string): TranspileResult => {
  initialize();

  const { code: codeIn, sourceMap } = Babel.transform(value, {
    cwd: '/',
    filename: path,
    sourceMaps: 'both',
    presets: ['@babel/preset-react'],
    plugins: [
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-proposal-async-generator-functions',
      '@babel/plugin-proposal-numeric-separator',
      '@babel/plugin-transform-modules-commonjs',
      ['@babel/plugin-transform-typescript', { isTSX: true }],
    ],
  });

  const sourceURL = `//# sourceURL=${location.origin}${path}`;
  const code = `${codeIn}\n${sourceURL}`;

  return { code, sourceMap };
};
