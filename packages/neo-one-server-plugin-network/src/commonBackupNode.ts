import { FullNode } from '@neo-one/node';
import { BackupRestoreOptions } from '@neo-one/node-data-backup';
import { CLIArgs } from '@neo-one/server-plugin';
import * as path from 'path';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Args, Command } from 'vorpal';
import { createFullNode } from './createFullNode';
import { createNEOONENodeConfig } from './node';

const getOption = ({ vorpal, shutdown }: CLIArgs, options: Args['options'], key: string): string | undefined => {
  const value = options[key];
  if (value == undefined) {
    vorpal.activeCommand.log(`--${key} is required.`);
    shutdown({ exitCode: 1 });
  }

  return value;
};

export const addOptions = (command: Command) => {
  command
    .option('--gcloud-project-id <projectID>', 'Google Cloud project id')
    .option('--gcloud-bucket <bucket>', 'Google Cloud bucket')
    .option('--gcloud-prefix <file>', 'Google Cloud prefix')
    .option('--mega-email <email>', 'Mega email')
    .option('--mega-password <password>', 'Mega password')
    .option('--mega-file <file>', 'Mega file name');
};

export const processArgs = async (
  cliArgs: CLIArgs,
  args: Args,
): Promise<{ readonly node: FullNode; readonly options: BackupRestoreOptions } | undefined> => {
  const { vorpal, monitor, shutdown, mutableShutdownFuncs, logConfig$ } = cliArgs;
  const { dataPath, provider, options: cliOptions } = args;
  let mega;
  let gcloud;
  if (provider === 'mega') {
    const email = getOption(cliArgs, cliOptions, 'mega-email');
    const password = getOption(cliArgs, cliOptions, 'mega-password');
    const file = getOption(cliArgs, cliOptions, 'mega-file');
    if (email === undefined || password === undefined || file === undefined) {
      return undefined;
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
    const prefix = getOption(cliArgs, cliOptions, 'gcloud-prefix');
    if (projectID === undefined || bucket === undefined || prefix === undefined) {
      return undefined;
    }
    gcloud = {
      projectID,
      bucket,
      prefix,
      writeBytesPerSecond: 50000000,
    };
  } else {
    vorpal.activeCommand.log(`Unknown provider: ${provider}. Valid choices: "mega", "gcloud"`);

    shutdown({ exitCode: 1 });

    return undefined;
  }
  const options = { gcloud, mega };

  const nodeConfig = createNEOONENodeConfig({ dataPath });
  const logPath = path.resolve(dataPath, 'log');
  const logSubscription = nodeConfig.config$
    .pipe(
      map((config) => config.log),
      distinctUntilChanged(),
      map((config) => ({
        name: 'node',
        path: logPath,
        level: config.level,
        maxSize: config.maxSize,
        maxFiles: config.maxFiles,
      })),
    )
    .subscribe(logConfig$);
  mutableShutdownFuncs.push(() => logSubscription.unsubscribe());

  const node = await createFullNode({
    dataPath,
    nodeConfig,
    monitor,
  });

  return { node, options };
};
