/* @flow */
import type { LogLevel } from './types';
import MonitorBase, { type Logger, type Tracer } from './MonitorBase';

type BrowserMonitorCreate = {|
  service: string,
  logger?: Logger,
  tracer?: Tracer,
  spanLogLevel?: LogLevel,
|};

export default class BrowserMonitor extends MonitorBase {
  static create({
    service,
    logger,
    tracer,
    spanLogLevel,
  }: BrowserMonitorCreate): BrowserMonitor {
    return new BrowserMonitor({
      service,
      component: service,
      logger: logger || {
        log: () => {},
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
