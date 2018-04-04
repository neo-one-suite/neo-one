/* @flow */
import type { Logger, LoggerLogOptions } from './MonitorBase';
import type { CollectingLoggerLogOptions } from './types';

export default class BrowserLogger implements Logger {
  _logs: Array<CollectingLoggerLogOptions>;

  constructor() {
    this._logs = [];
  }

  log(options: LoggerLogOptions): void {
    this._logs.push({
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
    });
  }

  collect(): Array<CollectingLoggerLogOptions> {
    const logs = this._logs;
    this._logs = [];

    return logs;
  }

  close(callback: () => void): void {
    callback();
  }
}
