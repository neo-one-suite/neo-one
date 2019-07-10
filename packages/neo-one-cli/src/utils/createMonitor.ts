import { DefaultMonitor, Monitor } from '@neo-one/monitor';
import { LogConfig } from '@neo-one/server-plugin';
import * as fs from 'fs-extra';
import * as path from 'path';
// tslint:disable-next-line: match-default-export-name
import pino from 'pino';
import { Subject } from 'rxjs';

const getFileStream = (filePath: string) => {
  fs.ensureDirSync(path.dirname(filePath));
  if (process.env.NODE_ENV === 'production') {
    return pino.extreme(filePath);
  }

  return pino.destination(filePath);
};

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
  const initLevel = logConsole || debug ? 'trace' : 'silent';
  let mutableLoggers: { readonly [k in string]: pino.Logger } = {
    cli: pino({ level: initLevel, useLevelLabels: true }),
  };

  let currentLogger: string;
  const monitor = DefaultMonitor.create({
    service: 'cli',
    logger: {
      log: (logMessage) => {
        const { error, level, data, ...rest } = logMessage;
        let message: typeof rest & { data?: typeof data; stack?: string | undefined } = { ...rest };

        if (error !== undefined) {
          message = {
            ...message,
            stack: error.stack,
          };
        }
        if (data !== undefined && Object.entries(data).length > 0) {
          message = {
            ...message,
            data,
          };
        }
        const serviceLogger = mutableLoggers[currentLogger];

        try {
          mutableLoggers.cli[level](message);
          serviceLogger[level](message);
        } catch {
          // do nothing
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

        Object.values(mutableLoggers).forEach((logger) => logger.flush());

        // Force an exit
        setTimeout(doExit, 250);
      },
    },
  });

  const config$ = new Subject<LogConfig>();
  const subscription = config$.subscribe({
    next: ({ name, path: logPath, level: logLevel }) => {
      const filename = path.resolve(logPath, name, `${name}.log`);
      const maybeLogger = mutableLoggers[name];
      // tslint:disable-next-line: strict-type-predicates
      if (maybeLogger === undefined) {
        try {
          const level = debug ? 'trace' : logLevel;
          mutableLoggers = {
            ...mutableLoggers,
            [name]: logPath
              ? pino({ level, useLevelLabels: true }, getFileStream(filename))
              : pino({ level, useLevelLabels: true }),
          };
        } catch (error) {
          monitor.logError({
            name: 'log_create_directory_error',
            message: 'Failed to create log directory',
            error,
          });
        }
      } else {
        // tslint:disable-next-line: no-object-mutation
        maybeLogger.level = logLevel;
      }
      currentLogger = name;
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
