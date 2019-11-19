import { Configuration } from '@neo-one/cli-common';
import * as nodePath from 'path';

export const getProcessIDFile = (config: Configuration, process: 'network' | 'neotracker') =>
  nodePath.resolve(config[process].path, '.pid');
