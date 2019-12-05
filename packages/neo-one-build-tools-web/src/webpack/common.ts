import path from 'path';
import webpack from 'webpack';
import { Bundle, Stage } from '../types';
import { addDefaultRules } from './addDefaultRules';
import { alias } from './alias';
import { node } from './node';
import { optimization } from './optimization';
import { rules } from './rules';

const TOOLS_NODE_MODULES = path.resolve(__dirname, '..', '..', 'node_modules');
const RUSH_NODE_MODULES = path.resolve(__dirname, '..', '..', '..', '..', 'common', 'temp', 'node_modules');

export const common = ({ stage, bundle }: { readonly stage: Stage; readonly bundle: Bundle }): webpack.Configuration =>
  addDefaultRules({
    mode: stage === 'dev' || stage === 'node' ? 'development' : 'production',
    resolve: {
      mainFields: ['browser', 'module', 'main'],
      aliasFields: ['browser'],
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
      alias,
      modules: [RUSH_NODE_MODULES, 'node_modules'],
    },
    resolveLoader: {
      modules: [TOOLS_NODE_MODULES, 'node_modules'],
    },
    optimization: optimization({ stage, bundle }),
    module: {
      rules: rules({ stage, bundle }),
    },
    node,
    devtool: stage === 'dev' || stage === 'node' ? 'cheap-module-source-map' : 'source-map',
  });
