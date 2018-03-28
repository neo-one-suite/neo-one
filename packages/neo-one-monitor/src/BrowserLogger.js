/* @flow */
import type { LoggerLogOptions } from './types';

import type { Logger } from './MonitorBase';

interface LoggerCollect extends Logger {
  collect(): Array<LoggerLogOptions>;
}

export default class BrowserLogger implements LoggerCollect {
  _logs: Array<LoggerLogOptions>;

  constructor() {
    this._logs = [];
  }

  log(options: LoggerLogOptions): void {
    this._logs.push(options);
  }

  collect(): Array<LoggerLogOptions> {
    const logs = this._logs;
    this._logs = [];

    return logs;
  }

  close(callback: () => void): void {
    callback();
  }
}
