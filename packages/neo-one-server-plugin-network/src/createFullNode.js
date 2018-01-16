/* @flow */
import type { Config, Log } from '@neo-one/server-plugin';
import FullNode from '@neo-one/node';

import { createMain, createTest } from '@neo-one/node-neo-settings';
import { distinct, map, take } from 'rxjs/operators';
import fs from 'fs-extra';
import path from 'path';

import type { NEOONENodeConfig } from './node';

export default async ({
  dataPath,
  nodeConfig,
  log,
  chainFile,
  onError,
}: {|
  dataPath: string,
  nodeConfig: Config<NEOONENodeConfig>,
  log: Log,
  chainFile?: string,
  onError?: (error: Error) => void,
|}) => {
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

  return new FullNode(
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
    onError,
  );
};
