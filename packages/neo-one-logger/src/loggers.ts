// tslint:disable: match-default-export-name
import { getPretty } from '@neo-one/logger-config';
import pino from 'pino';

const createLogger = (name: string, options: pino.LoggerOptions = {}) =>
  pino(
    { ...options, name, prettyPrint: getPretty() },
    process.env.NODE_ENV === 'production' ? pino.extreme(1) : pino.destination(2),
  );

export const editorLogger = createLogger('editor-server');
export const serverLogger = createLogger('server');
export const nodeLogger = createLogger('node');
export const rpcLogger = createLogger('rpc');
export const cliLogger = createLogger('cli');
export const httpLogger = createLogger('http');
export const testLogger = createLogger('test');
export const loggers: readonly pino.Logger[] = [
  editorLogger,
  serverLogger,
  nodeLogger,
  rpcLogger,
  cliLogger,
  httpLogger,
  testLogger,
];
export const setGlobalLogLevel = (level: pino.LevelWithSilent) =>
  loggers.forEach((logger) => {
    // tslint:disable-next-line no-object-mutation
    logger.level = level;
  });

export const getFinalLogger = (logger: pino.Logger) => pino.final(logger);
