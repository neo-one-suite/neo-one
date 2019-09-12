import * as path from 'path';
import webpack from 'webpack';
import { Bundle, Stage } from '../types';
import { addDefaultRules } from './addDefaultRules';
import { alias } from './alias';
import { node } from './node';
import { optimization } from './optimization';
import { rules } from './rules';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');
const RUSH_NODE_MODULES = path.resolve(APP_ROOT_DIR, 'common', 'temp', 'node_modules');

export const common = ({ stage, bundle }: { readonly stage: Stage; readonly bundle: Bundle }): webpack.Configuration =>
  addDefaultRules({
    mode: stage === 'dev' || stage === 'node' ? 'development' : 'production',
    resolve: {
      mainFields: ['browser', 'module', 'main'],
      aliasFields: ['browser'],
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
      alias,
      modules: [RUSH_NODE_MODULES, 'node_modules'],
      symlinks: true,
    },
    resolveLoader: {
      modules: [RUSH_NODE_MODULES],
    },
    optimization: optimization({ stage, bundle }),
    module: {
      rules: rules({ stage, bundle }),
    },
    node,
    devtool: stage === 'dev' || stage === 'node' ? 'cheap-module-source-map' : 'source-map',
  });
