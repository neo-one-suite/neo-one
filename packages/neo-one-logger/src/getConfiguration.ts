import envPaths from 'env-paths';
import rc from 'rc';
import { LogLevel } from './types';

export interface LoggerOptions {
  readonly path?: string;
  readonly level?: LogLevel;
}

export interface LoggersConfig {
  readonly ['*']?: LoggerOptions;
  readonly ['editor-server']?: LoggerOptions;
  readonly server?: LoggerOptions;
  readonly node?: LoggerOptions;
  readonly cli?: LoggerOptions;
  readonly http?: LoggerOptions;
  readonly test?: LoggerOptions;
}

export type LoggersCreate = Required<Omit<LoggersConfig, '*'>>;

const DEFAULT_LOG_PATH = envPaths('neo-one', { suffix: '' }).log;

const DEFAULT_CONFIG = {
  ['editor-server']: {
    level: 'silent',
  },
  server: {
    level: 'info',
    path: DEFAULT_LOG_PATH,
  },
  cli: {
    level: 'info',
    path: DEFAULT_LOG_PATH,
  },
  http: {
    level: 'silent',
  },
  test: {
    level: 'silent',
  },
} as const;

const getGlobalConfig = (level: LogLevel) =>
  ({
    ['editor-server']: {
      level,
    },
    server: {
      level,
    },
    cli: {
      level,
    },
    http: {
      level,
    },
    test: {
      level,
    },
    node: {
      level,
    },
  } as const);

export const getConfiguration = (): LoggersCreate => {
  const { environment } = rc('neo_one_node');

  const maybeLogger = environment !== undefined ? environment.logger : undefined;
  const maybePath = maybeLogger !== undefined ? maybeLogger.path : undefined;
  const maybeLevel = maybeLogger !== undefined ? maybeLogger.level : undefined;

  const loggingConfig = rc('neo_one_logging', {
    ...DEFAULT_CONFIG,
    node: {
      path: maybePath === undefined ? DEFAULT_LOG_PATH : maybePath,
      level: maybeLevel === undefined ? 'info' : maybeLevel,
    },
  });

  if (loggingConfig['*'] !== undefined) {
    return getGlobalConfig(loggingConfig['*'].level);
  }

  return loggingConfig as LoggersCreate;
};
