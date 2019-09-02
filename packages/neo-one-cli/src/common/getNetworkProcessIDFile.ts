import { Configuration } from '@neo-one/cli-common';
import * as nodePath from 'path';

export const getNetworkProcessIDFile = (config: Configuration) => nodePath.resolve(config.network.path, '.pid');
