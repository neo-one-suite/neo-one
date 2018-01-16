/* @flow */
import type { CLIArgs } from '@neo-one/server-plugin';

import { distinct, map } from 'rxjs/operators';
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

export default (cliArgs: CLIArgs) => {
  const { vorpal, log, shutdown, shutdownFuncs, logConfig$ } = cliArgs;
  vorpal
    .command('backup node <provider> <dataPath>', `Backup a node`)
    .option('--gcloud-project-id <projectID>', 'Google Cloud project id')
    .option('--gcloud-bucket <bucket>', 'Google Cloud bucket')
    .option('--gcloud-file <file>', 'Google Cloud file name')
    .option('--mega-email <email>', 'Mega email')
    .option('--mega-password <password>', 'Mega password')
    .option('--mega-file <file>', 'Mega file name')
    .action(async args => {
      const { dataPath, provider, options: cliOptions } = args;
      let mega;
      let gcloud;
      if (provider === 'mega') {
        const email = getOption(cliArgs, cliOptions, 'mega-email');
        const password = getOption(cliArgs, cliOptions, 'mega-password');
        const file = getOption(cliArgs, cliOptions, 'mega-file');
        if (email == null || password == null || file == null) {
          return;
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
          return;
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
        return;
      }
      const options = { gcloud, mega };

      const nodeConfig = createNEOONENodeConfig({ dataPath, log });
      const logPath = path.resolve(dataPath, 'log');
      const logSubscription = nodeConfig.config$
        .pipe(
          map(config => config.log),
          distinct(),
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
        log,
      });
      await node.backup(options);
    });
};
