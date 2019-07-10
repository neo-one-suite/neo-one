import { DefaultMonitor, LogLevel, Monitor } from '@neo-one/monitor';
// tslint:disable-next-line: match-default-export-name
import pino from 'pino';

export interface MonitorEnvironment {
  readonly level: LogLevel;
}

export const createMonitor = ({ level }: MonitorEnvironment): Monitor => {
  const logger = pino({ level, useLevelLabels: true });

  return DefaultMonitor.create({
    service: 'node',
    logger: {
      log: (logMessage) => {
        const { error, level: logLevel, data, ...rest } = logMessage;
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

        logger[logLevel](message);
      },
      close: (callback) => {
        let exited = false;
        const doExit = () => {
          if (!exited) {
            exited = true;
            callback();
          }
        };
        logger.flush();

        // Force an exit
        setTimeout(doExit, 250);
      },
    },
  });
};
