import { Configuration } from '@neo-one/cli-common';
import { loadJS, loadTS, Print } from '../common';

export const loadMigration = async (config: Configuration, print: Print) => {
  print('Loading migration');
  const migration = await (config.migration.path.endsWith('.js')
    ? loadJS(config.migration.path)
    : loadTS(config.migration.path));
  print('Loaded migration');

  return migration;
};
