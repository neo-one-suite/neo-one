/* @flow */
import type { LoggerLogOptions, LogLevel, Labels } from './types';

import type { Logger } from './MonitorBase';

export type CollectingLoggerLogOptions = {|
  name: string,
  level: LogLevel,
  message?: string,
  labels?: Labels,
  data?: Labels,
  error?: {|
    message?: string,
    stack?: string,
  |},
|};

export default class BrowserLogger implements Logger {
  _logs: Array<CollectingLoggerLogOptions>;

  constructor() {
    this._logs = [];
  }

  log(options: LoggerLogOptions): void {
    const log = {
      name: options.name,
      level: options.level,
      message: options.message,
      labels: options.labels,
      data: options.data,
      error: undefined,
    };
    if (options.error) {
      log.error = {
        message: options.error.message,
        stack: options.error.stack,
      };
    }
    this._logs.push(log);
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
