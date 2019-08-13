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

const DEFAULT_CONFIG = {
  ['editor-server']: {
    level: 'silent',
  },
  server: {
    level: 'silent',
  },
  cli: {
    level: 'silent',
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
  const { logger: maybeLogger } = rc('neo_one_node');
  const maybePath = maybeLogger !== undefined ? maybeLogger.path : undefined;
  const maybeLevel = maybeLogger !== undefined ? maybeLogger.level : undefined;
  const loggingConfig = rc('neo_one_logging', {
    ...DEFAULT_CONFIG,
    node: {
      path: maybePath === undefined ? undefined : maybePath,
      level: maybeLevel === undefined ? 'silent' : maybeLevel,
    },
  });

  if (loggingConfig['*'] !== undefined) {
    return getGlobalConfig(loggingConfig['*'].level);
  }

  return loggingConfig as LoggersCreate;
};
