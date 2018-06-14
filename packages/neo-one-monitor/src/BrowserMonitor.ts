import { MonitorBase, Tracer } from './MonitorBase';
import { Logger, LogLevel } from './types';

export interface BrowserMonitorCreate {
  readonly service: string;
  readonly logger?: Logger;
  readonly tracer?: Tracer;
  readonly spanLogLevel?: LogLevel;
}

export class BrowserMonitor extends MonitorBase {
  public static create({ service, logger, tracer, spanLogLevel }: BrowserMonitorCreate): BrowserMonitor {
    return new BrowserMonitor({
      service,
      component: service,
      logger:
        logger === undefined
          ? {
              log: () => {
                // do nothing
              },
              close: (callback) => {
                callback();
              },
            }
          : logger,
      tracer,
      // NOTE: We do not use performance.now because there is no longer a
      //       benefit in browsers with result rounding.
      now: () => Date.now(),
      spanLogLevel,
    });
  }
}
