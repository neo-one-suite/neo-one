import { FullNodeEnvironment, FullNodeOptions as ConfigOptions } from '@neo-one/node';
import { createMain, createTest } from '@neo-one/node-neo-settings';
import chokidar from 'chokidar';
import envPaths from 'env-paths';
import fs from 'fs-extra';
import rc from 'rc';
import { BehaviorSubject, concat, Observable, of } from 'rxjs';
import { distinctUntilChanged, publishReplay, refCount, scan } from 'rxjs/operators';
import SeamlessImmutable from 'seamless-immutable';
import { createMonitor, MonitorEnvironment } from './createMonitor';

export interface NodeBinEnvironment {
  readonly fullNodeEnvironment: FullNodeEnvironment;
  readonly settingsEnvironment: SettingsEnvironment;
  readonly monitorEnvironment: MonitorEnvironment;
  readonly options: ConfigOptions;
  readonly dumpChainFile: string | undefined;
  readonly chainFile: string | undefined;
  // tslint:disable-next-line:readonly-array
  readonly configs: string[] | undefined;
}

interface SettingsEnvironment {
  readonly type: 'main' | 'test';
  readonly privateNet?: boolean;
  readonly address?: string;
  readonly secondsPerBlock?: number;
  readonly standbyValidators?: ReadonlyArray<string>;
}

const DEFAULT_CONFIG = {
  environment: {
    dataPath: envPaths('neo_one_node', { suffix: false }).data,
    rpc: {
      http: {
        port: 8080,
        host: 'localhost',
      },
    },
  },
  settings: {
    type: 'main',
  },
  monitor: {
    level: 'info',
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

const fixArrayVariable = (data?: string | ReadonlyArray<string>) => (typeof data === 'string' ? data.split(',') : data);

// tslint:disable-next-line no-any
const fixEnvironmentOptions = (options: { [k in string]?: any }) => ({
  ...options,
  node: {
    ...options.node,
    rpcURLs: options.node !== undefined ? fixArrayVariable(options.node.rpcURLs) : undefined,
  },
  network: {
    ...options.network,
    seeds: options.network !== undefined ? fixArrayVariable(options.network.seeds) : undefined,
    peerSeeds: options.network !== undefined ? fixArrayVariable(options.network.peerSeeds) : undefined,
    externalEndpoints: options.network !== undefined ? fixArrayVariable(options.network.externalEndpoints) : undefined,
    connectErrorCodes: options.network !== undefined ? fixArrayVariable(options.network.connectErrorCodes) : undefined,
  },
  rpc: {
    ...options.rpc,
    liveHealthCheck:
      options.rpc !== undefined && options.rpc.liveHealthCheck !== undefined
        ? {
            ...options.rpc.liveHealthCheck,
            rpcURLs: fixArrayVariable(options.rpc.liveHealthCheck.rpcURLs),
          }
        : undefined,
    readyHealthCheck:
      options.rpc !== undefined && options.rpc.readyHealthCheck !== undefined
        ? {
            ...options.rpc.readyHealthCheck,
            rpcURLs: fixArrayVariable(options.rpc.readyHealthCheck.rpcURLs),
          }
        : undefined,
  },
});

const getFreshConfig = (): NodeBinEnvironment => {
  const config = rc('neo_one_node', DEFAULT_CONFIG);

  return {
    fullNodeEnvironment: config.environment,
    settingsEnvironment: config.settings,
    monitorEnvironment: config.monitor,
    options: config.options === undefined ? {} : fixEnvironmentOptions(config.options),
    dumpChainFile: config.dumpChainFile,
    chainFile: config.chainFile,
    configs: config.configs,
  };
};

export const getConfiguration = () => {
  const {
    fullNodeEnvironment: environment,
    settingsEnvironment,
    monitorEnvironment,
    options: initialOptions,
    dumpChainFile,
    chainFile,
    configs,
  } = getFreshConfig();

  fs.ensureDirSync(environment.dataPath);

  const monitor = createMonitor(monitorEnvironment);
  const settings = getSettings(settingsEnvironment);

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

  return { monitor, environment, settings, options$, dumpChainFile, chainFile };
};
