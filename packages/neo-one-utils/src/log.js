/* @flow */
// $FlowFixMe
import { performance } from 'perf_hooks'; // eslint-disable-line

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

const now = () => performance.now();
// eslint-disable-next-line
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
