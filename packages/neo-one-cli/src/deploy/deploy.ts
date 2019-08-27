import { Configuration } from '@neo-one/cli-common';
import { loadClient } from './loadClient';
import { loadContracts } from './loadContracts';
import { loadMigration } from './loadMigration';
import { runMigration } from './runMigration';

export const deploy = async (config: Configuration, network: string) => {
  const print = console.log.bind(console);
  const client = await loadClient(config, network, print);
  const migration = await loadMigration(config, print);
  const { contracts, sourceMaps } = await loadContracts(config, client, print);
  await runMigration(migration, contracts, sourceMaps, client, network, print);
};
