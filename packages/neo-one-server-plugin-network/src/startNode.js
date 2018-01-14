/* @flow */
import type { CLIArgs } from '@neo-one/server-plugin';
import FullNode from '@neo-one/node';

import { createMain, createTest } from '@neo-one/node-neo-settings';
import { distinct, map, take } from 'rxjs/operators';
import fs from 'fs-extra';
import path from 'path';

import { createNEOONENodeConfig } from './node';

export default ({
  vorpal,
  log,
  shutdown,
  shutdownFuncs,
  logConfig$,
}: CLIArgs) => {
  vorpal
    .command('start node <dataPath>', `Starts a full node`)
    .option(
      '-c, --chain <chain>',
      'Path of a chain.acc file to bootstrap the node',
    )
    .action(async args => {
      const { dataPath, options: cliOptions } = args;

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

      const storagePath = path.resolve(dataPath, 'chain');
      // eslint-disable-next-line
      const [settings, rpcEnvironment, nodeEnvironment, _] = await Promise.all([
        nodeConfig.config$
          .pipe(
            map(config => config.settings),
            distinct(),
            map(config => {
              const options = {
                privateNet: config.privateNet,
                secondsPerBlock: config.secondsPerBlock,
                standbyValidators:
                  config.standbyValidators == null
                    ? undefined
                    : [...config.standbyValidators],
                address: config.address,
              };
              return config.test ? createTest(options) : createMain(options);
            }),
            take(1),
          )
          .toPromise(),
        nodeConfig.config$
          .pipe(map(config => config.environment.rpc), take(1))
          .toPromise(),
        nodeConfig.config$
          .pipe(map(config => config.environment.node), take(1))
          .toPromise(),
        fs.ensureDir(storagePath),
      ]);

      let chainFile;
      if (cliOptions.chain != null) {
        chainFile = cliOptions.chain;
      }
      const node = new FullNode(
        {
          log,
          settings,
          environment: {
            dataPath: storagePath,
            rpc: rpcEnvironment,
            node: nodeEnvironment,
          },
          options$: nodeConfig.config$.pipe(
            map(config => config.options),
            distinct(),
          ),
          chainFile,
        },
        error => {
          log({ event: 'UNCAUGHT_NODE_ERROR', error });
          shutdown({ exitCode: 1, error });
        },
      );
      node.start();
      shutdownFuncs.push(() => node.stop());
    });
};
