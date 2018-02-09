/* @flow */
import envPaths from 'env-paths';

import name from './name';

export type Paths = {|
  data: string,
  config: string,
  cache: string,
  log: string,
  temp: string,
|};
export default (envPaths(name.cli, { suffix: false }): Paths);
