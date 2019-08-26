import { Configuration } from '@neo-one/cli-common';
import { register } from 'ts-node';

const load = async (path: string) => {
  const value = await import(path);

  return value.default === undefined ? value : value.default;
};

const loadJS = async (path: string) => {
  // @ts-ignore
  await import('@babel/register');

  return load(path);
};

const loadTS = async (path: string) => {
  register();

  return load(path);
};

export const loadMigration = async (config: Configuration) =>
  config.migration.path.endsWith('.js') ? loadJS(config.migration.path) : loadTS(config.migration.path);
