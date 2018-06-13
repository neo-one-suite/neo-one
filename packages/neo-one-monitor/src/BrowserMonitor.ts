import { Logger, LogLevel } from './types';
import { MonitorBase, Tracer } from './MonitorBase';

export interface BrowserMonitorCreate {
  service: string;
  logger?: Logger;
  tracer?: Tracer;
  spanLogLevel?: LogLevel;
}

export class BrowserMonitor extends MonitorBase {
  public static create({
    service,
    logger,
    tracer,
    spanLogLevel,
  }: BrowserMonitorCreate): BrowserMonitor {
    return new BrowserMonitor({
      service,
      component: service,
      logger: logger || {
        log: () => {
          // do nothing
        },
        close: (callback: () => void) => {
          callback();
        },
      },
      tracer,
      // NOTE: We do not use performance.now because there is no longer a
      //       benefit in browsers with result rounding.
      now: () => Date.now(),
      spanLogLevel,
    });
  }
}
