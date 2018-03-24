/* @flow */
import { Subject } from 'rxjs/Subject';
import type { LogConfig } from '@neo-one/server-plugin';
import {
  type LoggerLogOptions,
  type Monitor,
  DefaultMonitor,
} from '@neo-one/monitor';

import { createLogger, format, transports } from 'winston';
import fs from 'fs-extra';
import path from 'path';

import './patchWinston';

export default ({
  logConsole,
  debug,
}: {|
  logConsole?: boolean,
  debug?: boolean,
|}): {|
  config$: Subject<LogConfig>,
  monitor: Monitor,
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
  logger.on('error', error => {
    // eslint-disable-next-line
    console.error(error);
  });
  const monitor = DefaultMonitor.create({
    service: 'cli',
    logger: {
      log: (logMessage: LoggerLogOptions) => {
        const { error, ...rest } = logMessage;

        let message = { ...rest };
        if (error != null) {
          message = {
            ...message,
            stack: error.stack,
          };
        }

        if (logger.transports.length > 0) {
          logger.log(message);
        }
      },
      close: (callback: () => void) => {
        let exited = false;
        const doExit = () => {
          if (!exited) {
            exited = true;
            callback();
          }
        };
        const numFlushes = logger.transports.length;
        let numFlushed = 0;
        logger.transports.forEach(transport => {
          transport.once('finish', () => {
            numFlushed += 1;
            if (numFlushes === numFlushed) {
              setTimeout(() => doExit(), 10);
            }
          });

          transport.end();
        });

        // Force an exit
        setTimeout(() => doExit(), 5000);
      },
    },
  });

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
          monitor.logError({
            name: 'log_create_directory_error',
            message: 'Failed to create log directory',
            error,
          });
        });
    },
  });

  return {
    monitor,
    config$,
    cleanup: () => {
      subscription.unsubscribe();
    },
  };
};
