// tslint:disable no-console
import { Configuration } from '@neo-one/cli-common';
import execa from 'execa';
import { loadClient } from '../common';
import { Command } from '../types';
import { loadContracts } from './loadContracts';
import { loadMigration } from './loadMigration';
import { runMigration } from './runMigration';

export const deploy = async (cmd: Command, config: Configuration, network: string) => {
  const print = console.log.bind(console);
  const client = await loadClient(config, [network], print);
  const migration = await loadMigration(config, print);
  const { contracts, sourceMaps } = await loadContracts(config, print);
  await runMigration(config, migration, contracts, sourceMaps, client, network, print);
  await execa(cmd.bin, cmd.args.concat(['build']));
};
