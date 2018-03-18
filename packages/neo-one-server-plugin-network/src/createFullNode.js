/* @flow */
import type { Config } from '@neo-one/server-plugin';
import FullNode from '@neo-one/node';
import type { Monitor } from '@neo-one/monitor';

import { createMain, createTest } from '@neo-one/node-neo-settings';
import { distinctUntilChanged, map, take } from 'rxjs/operators';
import fs from 'fs-extra';
import path from 'path';

import type { NEOONENodeConfig } from './node';

export default async ({
  dataPath,
  nodeConfig,
  monitor,
  chainFile,
  dumpChainFile,
  onError,
}: {|
  dataPath: string,
  nodeConfig: Config<NEOONENodeConfig>,
  monitor: Monitor,
  chainFile?: string,
  dumpChainFile?: string,
  onError?: (error: Error) => void,
|}) => {
  const storagePath = path.resolve(dataPath, 'chain');
  const [
    settings,
    rpcEnvironment,
    nodeEnvironment,
    telemetryEnvironment,
  ] = await Promise.all([
    nodeConfig.config$
      .pipe(
        map(config => config.settings),
        distinctUntilChanged(),
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
    nodeConfig.config$
      .pipe(map(config => config.environment.telemetry), take(1))
      .toPromise(),
    fs.ensureDir(storagePath),
  ]);

  return new FullNode(
    {
      monitor,
      settings,
      environment: {
        dataPath: storagePath,
        rpc: rpcEnvironment,
        node: nodeEnvironment,
        telemetry: telemetryEnvironment,
      },
      options$: nodeConfig.config$.pipe(
        map(config => config.options),
        distinctUntilChanged(),
      ),
      chainFile,
      dumpChainFile,
    },
    onError,
  );
};
