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

const getFreshConfig = (): NodeBinEnvironment => {
  const config = rc('neo_one_node', DEFAULT_CONFIG);

  return {
    fullNodeEnvironment: config.environment,
    settingsEnvironment: config.settings,
    monitorEnvironment: config.monitor,
    options: config.options === undefined ? {} : config.options,
    configs: config.configs,
  };
};

export const getConfiguration = () => {
  const {
    fullNodeEnvironment: environment,
    settingsEnvironment,
    monitorEnvironment,
    options: initialOptions,
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

  return { monitor, environment, settings, options$ };
};
