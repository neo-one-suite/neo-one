import { CollectedLoggerLogOptions, Logger, LoggerLogOptions } from './types';

export class CollectingLogger implements Logger {
  // tslint:disable-next-line readonly-array readonly-keyword
  private logs: CollectedLoggerLogOptions[] = [];

  public log(options: LoggerLogOptions): void {
    const error = options.error as (Error & { code?: number }) | undefined;
    const logOptions = {
      name: options.name,
      level: options.level,
      message: options.message,
      labels: options.labels,
      data: options.data,
      error:
        error === undefined
          ? undefined
          : {
              message: error.message,
              stack: error.stack,
              code: error.code === undefined ? error.constructor.name : `${error.code}`,
            },
    };

    // tslint:disable-next-line no-array-mutation
    this.logs.push(logOptions);
  }

  public collect(): readonly CollectedLoggerLogOptions[] {
    const localLogs = this.logs;
    // tslint:disable-next-line no-object-mutation
    this.logs = [];

    return localLogs;
  }

  // tslint:disable-next-line
  public close(callback: () => void): void {
    callback();
  }
}
