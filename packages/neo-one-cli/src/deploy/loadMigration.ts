import { Configuration } from '@neo-one/cli-common';
import { loadJS, loadTS } from './load';

export const loadMigration = async (config: Configuration) =>
  config.migration.path.endsWith('.js') ? loadJS(config.migration.path) : loadTS(config.migration.path);
