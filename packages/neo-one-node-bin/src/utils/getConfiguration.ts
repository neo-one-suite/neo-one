import { LogLevel } from '@neo-one/monitor';
import { FullNodeCreateOptions, FullNodeEnvironment, FullNodeOptions as ConfigOptions } from '@neo-one/node';
import { createMain, createTest } from '@neo-one/node-neo-settings';
import chokidar from 'chokidar';
import envPaths from 'env-paths';
import fs from 'fs-extra';
import rc from 'rc';
import { BehaviorSubject, concat, Observable, of } from 'rxjs';
import { distinctUntilChanged, publishReplay, refCount, scan } from 'rxjs/operators';
import SeamlessImmutable from 'seamless-immutable';
import { createMonitor } from './createMonitor';
import {
  extractBackupConfiguration,
  extractNetworkConfiguration,
  extractNodeConfiguration,
  extractRPCConfiguration,
} from './extractConfigurations';

interface SettingsEnvironment {
  readonly type: 'main' | 'test' | string;
  readonly privateNet?: boolean;
  readonly address?: string;
  readonly secondsPerBlock?: number;
  readonly standbyValidators?: readonly string[];
}

export interface NodeBinCreate {
  readonly environment: FullNodeEnvironment & { readonly monitor: LogLevel };
  readonly settings: SettingsEnvironment;
  readonly options: ConfigOptions;
  // tslint:disable-next-line: readonly-array
  readonly configs: string[] | undefined;
}

const DEFAULT_CONFIG = {
  environment: {
    dataPath: envPaths('neo_one_node', { suffix: '' }).data,
    monitor: 'info',
  },
  rpc: {
    http: {
      port: process.env.PORT !== undefined ? process.env.PORT : 8080,
      host: 'localhost',
    },
  },
  settings: {
    type: 'main',
  },
};

const getSettings = (settings: SettingsEnvironment) => {
  const { type, ...rest } = settings;
  switch (type) {
    case 'main': {
      return createMain(rest);
    }
    case 'test': {
      return createTest(rest);
    }
    default: {
      throw new Error("`type` must be 'main' or 'test'.");
    }
  }
};

const getFreshConfig = (): NodeBinCreate => {
  const { settings, environment: environmentPartial, rpc, node, network, backup, configs } = rc(
    'neo_one_node',
    DEFAULT_CONFIG,
  );
  const { environment: rpcEnv, options: rpcOptions } = extractRPCConfiguration(rpc);
  const { environment: nodeEnv, options: nodeOptions } = extractNodeConfiguration(node);
  const { environment: networkEnv, options: networkOptions } = extractNetworkConfiguration(network);
  const { environment: backupEnv, options: backupOptions } = extractBackupConfiguration(backup);

  const environment = {
    rpc: rpcEnv,
    node: nodeEnv,
    network: networkEnv,
    backup: backupEnv,
    ...environmentPartial,
  };

  const options = {
    rpc: rpcOptions,
    node: nodeOptions,
    network: networkOptions,
    backup: backupOptions,
  };

  return {
    settings,
    environment,
    options,
    configs,
  };
};

export const getConfiguration = (): FullNodeCreateOptions => {
  const { environment, settings: settingsIn, options: initialOptions, configs } = getFreshConfig();

  fs.ensureDirSync(environment.dataPath);

  const monitor = createMonitor({ level: environment.monitor });
  const settings = getSettings(settingsIn);

  let options$: Observable<ConfigOptions> = new BehaviorSubject(initialOptions);
  if (configs !== undefined && configs.length > 0) {
    const watcher$ = new Observable<ConfigOptions>((observer) => {
      const watcher = chokidar.watch(configs, { ignoreInitial: true });
      watcher.on('change', () => {
        const { options } = getFreshConfig();

        observer.next(options);
      });

      return () => {
        watcher.close();
      };
    }).pipe(
      scan(
        // tslint:disable-next-line:no-any
        (prevOptions, options) => (SeamlessImmutable as any).merge(prevOptions, options, { deep: true }),
        initialOptions,
      ),
    );

    options$ = concat(of(initialOptions), watcher$).pipe(
      distinctUntilChanged(),
      publishReplay(1),
      refCount(),
    );
  }

  return { environment, settings, monitor, options$ };
};
