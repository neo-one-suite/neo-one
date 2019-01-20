import { DefaultMonitor, Monitor } from '@neo-one/monitor';
import { LogConfig } from '@neo-one/server-plugin';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Subject } from 'rxjs';
import { createLogger, format, transports } from 'winston';

export const createMonitor = ({
  logConsole,
  debug,
}: {
  readonly logConsole?: boolean;
  readonly debug?: boolean;
}): {
  readonly config$: Subject<LogConfig>;
  readonly monitor: Monitor;
  readonly cleanup: () => void;
} => {
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

  logger.on('error', (error) => {
    // tslint:disable-next-line no-console
    console.error(error);
  });
  const monitor = DefaultMonitor.create({
    service: 'cli',
    logger: {
      log: (logMessage) => {
        const { error, ...rest } = logMessage;

        let message: typeof rest & { stack?: string | undefined } = { ...rest };
        if (error !== undefined) {
          message = {
            ...message,
            stack: error.stack,
          };
        }

        if (logger.transports.length > 0) {
          // tslint:disable-next-line no-any
          logger.log(message as any);
        }
      },
      close: (callback) => {
        let exited = false;
        const doExit = () => {
          if (!exited) {
            exited = true;
            callback();
          }
        };
        const numFlushes = logger.transports.length;
        let numFlushed = 0;
        logger.transports.forEach((transport) => {
          transport.once('finish', () => {
            numFlushed += 1;
            if (numFlushes === numFlushed) {
              setTimeout(doExit, 30);
            }
          });

          transport.end();
        });

        // Force an exit
        setTimeout(doExit, 250);
      },
    },
  });

  const config$ = new Subject<LogConfig>();
  const subscription = config$.subscribe({
    next: ({ name, path: logPath, level, maxSize, maxFiles }) => {
      const filename = path.resolve(logPath, name, `${name}.log`);
      fs.ensureDir(path.dirname(filename))
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
        .catch((error) => {
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
