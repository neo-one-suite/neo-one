// tslint:disable: match-default-export-name
import fs from 'fs-extra';
import nodePath from 'path';
import pino from 'pino';
import { getConfiguration } from './getConfiguration';

const { tests, config } = getConfiguration();
const mutablePathRecord: Record<string, string | undefined> = {};

const getPinoDestination = (path: string, name: string) => {
  const logPath = nodePath.resolve(path, name, `${name}.log`);
  fs.ensureDirSync(nodePath.dirname(logPath));

  return process.env.NODE_ENV === 'production' ? pino.extreme(logPath) : pino.destination(logPath);
};

const createLogger = (name: keyof typeof config) => {
  const { path, level } = config[name];
  mutablePathRecord[name] = path;

  return path === undefined
    ? pino({ name, level, useLevelLabels: true })
    : pino({ name, level, useLevelLabels: true }, getPinoDestination(path, name));
};

export const editorLogger = createLogger('editor-server');
export const serverLogger = createLogger('server');
export const nodeLogger = createLogger('node');
export const cliLogger = createLogger('cli');
export const httpLogger = createLogger('http');

export const getFinalLogger = (logger: pino.Logger) => pino.final(logger);
export const getLogPath = (name: keyof typeof config) => mutablePathRecord[name];

export const silenceForTests = () => {
  if (!tests.enabled) {
    // tslint:disable: no-object-mutation
    editorLogger.level = 'silent';
    serverLogger.level = 'silent';
    nodeLogger.level = 'silent';
    cliLogger.level = 'silent';
    httpLogger.level = 'silent';
    // tslint:enable: no-object-mutation
  }
};
