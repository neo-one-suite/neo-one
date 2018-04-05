/* @flow */
import type { Logger, LoggerLogOptions } from './MonitorBase';
import type { CollectedLoggerLogOptions } from './types';

export default class CollectingLogger implements Logger {
  _logs: Array<CollectedLoggerLogOptions>;

  constructor() {
    this._logs = [];
  }

  log(options: LoggerLogOptions): void {
    const logOptions = {
      name: options.name,
      level: options.level,
      message: options.message,
      labels: options.labels,
      data: options.data,
      error:
        options.error == null
          ? undefined
          : {
              message: options.error.message,
              stack: options.error.stack,
              code:
                (options.error: $FlowFixMe).code == null
                  ? options.error.constructor.name
                  : (options.error: $FlowFixMe).code,
            },
    };

    if (logOptions.error == null) {
      delete logOptions.error;
    }

    this._logs.push(logOptions);
  }

  collect(): Array<CollectedLoggerLogOptions> {
    const logs = this._logs;
    this._logs = [];

    return logs;
  }

  close(callback: () => void): void {
    callback();
  }
}
