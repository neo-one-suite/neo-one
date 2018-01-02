/* @flow */
import type { Log } from './log';

async function logInvoke<T>(
  log: Log,
  event: string,
  extra: Object,
  fn: () => Promise<T>,
  cleanupFn?: () => Promise<T>,
): Promise<T> {
  log({ ...extra, event: `${event}` });
  try {
    const res = await fn();
    log({
      ...extra,
      event: `${event}_SUCCESS`,
    });
    return res;
  } catch (error) {
    log({
      ...extra,
      event: `${event}_ERROR`,
      error,
    });
    if (cleanupFn != null) {
      try {
        await cleanupFn();
      } catch (err) {
        log({
          ...extra,
          event: `${event}_CLEANUP_ERROR`,
          error: err,
        });
      }
    }
    throw error;
  }
}

export default logInvoke;
