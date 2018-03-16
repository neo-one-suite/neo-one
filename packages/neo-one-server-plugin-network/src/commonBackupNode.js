/* @flow */
import type { BackupRestoreOptions } from '@neo-one/node-data-backup';
import type { Command } from 'vorpal';
import type { CLIArgs } from '@neo-one/server-plugin';
import type FullNode from '@neo-one/node';

import { distinctUntilChanged, map } from 'rxjs/operators';
import path from 'path';

import createFullNode from './createFullNode';
import { createNEOONENodeConfig } from './node';

const getOption = (
  { vorpal, shutdown }: CLIArgs,
  options: Object,
  key: string,
): ?string => {
  const value = options[key];
  if (value == null) {
    vorpal.activeCommand.log(`--${key} is required.`);
    shutdown({ exitCode: 1 });
  }

  return value;
};

export const addOptions = (command: Command) => {
  command
    .option('--gcloud-project-id <projectID>', 'Google Cloud project id')
    .option('--gcloud-bucket <bucket>', 'Google Cloud bucket')
    .option('--gcloud-file <file>', 'Google Cloud file name')
    .option('--mega-email <email>', 'Mega email')
    .option('--mega-password <password>', 'Mega password')
    .option('--mega-file <file>', 'Mega file name');
};

export const processArgs = async (
  cliArgs: CLIArgs,
  args: any,
): Promise<?{| node: FullNode, options: BackupRestoreOptions |}> => {
  const { vorpal, monitor, shutdown, shutdownFuncs, logConfig$ } = cliArgs;
  const { dataPath, provider, options: cliOptions } = args;
  let mega;
  let gcloud;
  if (provider === 'mega') {
    const email = getOption(cliArgs, cliOptions, 'mega-email');
    const password = getOption(cliArgs, cliOptions, 'mega-password');
    const file = getOption(cliArgs, cliOptions, 'mega-file');
    if (email == null || password == null || file == null) {
      return null;
    }
    mega = {
      upload: {
        email,
        password,
        file,
      },
    };
  } else if (provider === 'gcloud') {
    const projectID = getOption(cliArgs, cliOptions, 'gcloud-project-id');
    const bucket = getOption(cliArgs, cliOptions, 'gcloud-bucket');
    const file = getOption(cliArgs, cliOptions, 'gcloud-file');
    if (projectID == null || bucket == null || file == null) {
      return null;
    }
    gcloud = {
      projectID,
      bucket,
      file,
      writeBytesPerSecond: 10000,
    };
  } else {
    vorpal.activeCommand.log(
      `Unknown provider: ${provider}. Valid choices: "mega", "gcloud"`,
    );
    shutdown({ exitCode: 1 });
    return null;
  }
  const options = { gcloud, mega };

  const nodeConfig = createNEOONENodeConfig({ dataPath });
  const logPath = path.resolve(dataPath, 'log');
  const logSubscription = nodeConfig.config$
    .pipe(
      map(config => config.log),
      distinctUntilChanged(),
      map(config => ({
        name: 'node',
        path: logPath,
        level: config.level,
        maxSize: config.maxSize,
        maxFiles: config.maxFiles,
      })),
    )
    .subscribe(logConfig$);
  shutdownFuncs.push(() => logSubscription.unsubscribe());

  const node = await createFullNode({
    dataPath,
    nodeConfig,
    monitor,
  });

  return { node, options };
};
