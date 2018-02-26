/* @flow */
export type LogLevel =
  | 'error'
  | 'warn'
  | 'info'
  | 'verbose'
  | 'debug'
  | 'silly';

export type LogValue =
  | ?{ [key: string]: LogValue }
  | ?Array<LogValue>
  | ?number
  | ?string
  | ?boolean
  | ?Error;

export type LogData = {
  error?: Error,
  [key: string]: LogValue,
};

export type LogMessage = {
  event: string,
  level?: LogLevel,
  error?: Error,
  [key: string]: LogValue,
};
export type Log = (message: LogMessage, onLogComplete?: () => void) => void;

export type Profiler = {| stop: () => void |};
export type Profile = (point: string, data?: LogData) => Profiler;

const loadTime = Date.now();
export const now = () => {
  if (typeof performance !== 'undefined' && performance && performance.now) {
    return performance.now();
  } else if (process) {
    // So webpack doesn't try to bundle it.
    const perfHooks = 'perf_hooks';
    // $FlowFixMe
    return require(perfHooks).performance.now(); // eslint-disable-line
  }

  return Date.now() - loadTime;
};
export const createProfile = (log: Log): Profile => (
  point: string,
  data?: LogData,
): Profiler => {
  const start = now();
  return {
    stop: () => {
      const durationMS = now() - start;
      if (durationMS > 1) {
        log({
          event: 'PROFILE',
          ...(data || {}),
          point,
          durationMS,
        });
      }
    },
  };
};
