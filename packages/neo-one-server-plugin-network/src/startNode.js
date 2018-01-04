/* @flow */
import type { CLIArgs } from '@neo-one/server-plugin';

import { createMain, createTest } from '@neo-one/neo-settings';
import { createProfile } from '@neo-one/utils';
import { distinct, map, take } from 'rxjs/operators';
import fs from 'fs-extra';
import fullNode$ from '@neo-one/full-node';
import path from 'path';

import { createNEOBlockchainNodeConfig } from './node';

export default ({
  vorpal,
  log,
  shutdown,
  shutdownFuncs,
  logConfig$,
}: CLIArgs) => {
  vorpal
    .command('start node <dataPath>', `Starts a full node`)
    .action(async args => {
      const { dataPath } = args;

      const nodeConfig = createNEOBlockchainNodeConfig({ dataPath, log });

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

      const chainPath = path.resolve(dataPath, 'chain');
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
        fs.ensureDir(chainPath),
      ]);

      const node$ = fullNode$({
        log,
        createLogForContext: () => log,
        createProfile,
        settings,
        environment: {
          dataPath: chainPath,
          rpc: rpcEnvironment,
          node: nodeEnvironment,
        },
        options$: nodeConfig.config$.pipe(
          map(config => config.options),
          distinct(),
        ),
      });
      const subscription = node$.subscribe({
        error: error => {
          log({ event: 'UNCAUGHT_NODE_ERROR', error });
          shutdown({ exitCode: 1, error });
        },
        complete: () => {
          log({ event: 'UNEXPECTED_NODE_COMPLETE' });
          shutdown({ exitCode: 1 });
        },
      });
      shutdownFuncs.push(() => subscription.unsubscribe());
    });
};
