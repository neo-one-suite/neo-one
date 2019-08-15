import envPaths from 'env-paths';
import rc from 'rc';
import { LogLevel } from './types';

export interface LoggerOptions {
  readonly path?: string;
  readonly level?: LogLevel;
}

export interface LoggersOptions {
  readonly ['editor-server']: LoggerOptions;
  readonly server: LoggerOptions;
  readonly node: LoggerOptions;
  readonly cli: LoggerOptions;
  readonly http: LoggerOptions;
}

export interface LoggersConfig extends Partial<LoggersOptions> {
  readonly ['*']?: LoggerOptions;
  readonly tests?: { readonly enabled: boolean };
}

export interface LoggersCreate {
  readonly config: LoggersOptions;
  readonly tests: { readonly enabled: boolean };
}

const getNodeConfiguration = (): LoggerOptions => {
  const { environment } = rc('neo_one_node');

  const maybeLogger = environment !== undefined ? environment.logger : undefined;
  const maybePath = maybeLogger !== undefined ? maybeLogger.path : undefined;
  const maybeLevel = maybeLogger !== undefined ? maybeLogger.level : undefined;

  return {
    path: maybePath === undefined ? DEFAULT_LOG_PATH : maybePath,
    level: maybeLevel === undefined ? 'info' : maybeLevel,
  };
};

const DEFAULT_LOG_PATH = envPaths('neo-one', { suffix: '' }).log;

const DEFAULT_CONFIG = {
  ['editor-server']: {
    level: 'silent',
  },
  server: {
    level: 'info',
    path: DEFAULT_LOG_PATH,
  },
  node: getNodeConfiguration(),
  cli: {
    level: 'info',
    path: DEFAULT_LOG_PATH,
  },
  http: {
    level: 'silent',
  },
} as const;

const applyGlobalOptions = (config: LoggersOptions, globalOptions?: LoggerOptions) => {
  if (globalOptions === undefined) {
    return config;
  }

  return Object.entries(config).reduce<LoggersOptions>(
    (acc, [key, entry]) => ({
      ...acc,
      [key]: {
        path: globalOptions.path ? globalOptions.path : entry.path,
        level: globalOptions.level ? globalOptions.level : entry.level,
      },
    }),
    config,
  );
};

export const getConfiguration = (): LoggersCreate => {
  const { ['*']: globalOptions, tests, ...loggingConfig } = rc('neo_one_logging', {
    ...DEFAULT_CONFIG,
  }) as LoggersConfig;

  return {
    config: applyGlobalOptions(loggingConfig as LoggersOptions, globalOptions),
    tests: tests === undefined ? { enabled: false } : tests,
  };
};
