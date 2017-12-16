/* @flow */
import { Subject } from 'rxjs/Subject';
import type { Log, LogMessage } from '@neo-one/utils';
import type { LogConfig } from '@neo-one/server-common';

import { createLogger, format, transports } from 'winston';
import fs from 'fs-extra';
import path from 'path';

const isError = (message: LogMessage) =>
  message.event.toLowerCase().includes('error') ||
  message.event.toLowerCase().includes('failure') ||
  message.event.toLowerCase().includes('exception') ||
  message.error != null;

export default ({
  logConsole,
  debug,
}: {|
  logConsole?: boolean,
  debug?: boolean,
|}): {|
  config$: Subject<LogConfig>,
  log: Log,
  cleanup: () => void,
|} => {
  const formats = format.combine(format.timestamp(), format.json());
  const logger = createLogger({
    transports:
      logConsole || debug
        ? [
            new transports.Console({
              level: 'silly',
              format: formats,
            }),
          ]
        : [],
  });
  const log = (logMessage: LogMessage, callbackIn?: () => void) => {
    const { error, ...rest } = logMessage;
    let { level } = logMessage;
    if (level == null) {
      level = isError(logMessage) ? 'error' : 'info';
    }

    let onExit = null;
    const callback = callbackIn;
    if (callback != null) {
      onExit = () => callback();
    }

    let message = { ...rest, level };
    if (error != null) {
      message = {
        ...message,
        stack: error.stack,
      };
    }

    if (logger.transports.length > 0) {
      logger.log(message);
      if (onExit != null) {
        const onExitNonNull = onExit;
        const numFlushes = logger.transports.length;
        let numFlushed = 0;
        logger.transports.forEach(transport => {
          transport.once('finish', () => {
            numFlushed += 1;
            if (numFlushes === numFlushed) {
              setTimeout(() => onExitNonNull(), 10);
            }
          });

          transport.end();
        });
      }
    } else if (onExit != null) {
      onExit();
    }
  };
  const config$ = new Subject();
  const subscription = config$.subscribe({
    next: ({ name, path: logPath, level, maxSize, maxFiles }) => {
      const filename = path.resolve(logPath, name, `${name}.log`);
      fs
        .ensureDir(path.dirname(filename))
        .then(() => {
          logger.clear().add(
            new transports.File({
              format: formats,
              filename,
              level,
              maxsize: maxSize,
              maxFiles,
            }),
          );
          if (debug) {
            logger.add(
              new transports.Console({
                level: 'silly',
                format: formats,
              }),
            );
          }
        })
        .catch(error => {
          log({ event: 'LOG_CREATE_DIR_ERROR', error });
        });
    },
  });

  return {
    log,
    config$,
    cleanup: () => {
      subscription.unsubscribe();
    },
  };
};
