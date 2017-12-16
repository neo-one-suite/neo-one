/* @flow */
import envPaths from 'env-paths';

import name from './name';

export default (envPaths(name.cli, { suffix: false }): {|
  data: string,
  config: string,
  cache: string,
  log: string,
  temp: string,
|});
