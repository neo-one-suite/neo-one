import { CollectedLoggerLogOptions, Logger, LoggerLogOptions } from './types';

export class CollectingLogger implements Logger {
  private logs: CollectedLoggerLogOptions[] = [];

  public log(options: LoggerLogOptions): void {
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
                (options.error as any).code == null
                  ? options.error.constructor.name
                  : (options.error as any).code,
            },
    };

    if (logOptions.error == null) {
      delete logOptions.error;
    }

    this.logs.push(logOptions);
  }

  public collect(): CollectedLoggerLogOptions[] {
    const { logs } = this;
    this.logs = [];

    return logs;
  }

  public close(callback: () => void): void {
    callback();
  }
}
