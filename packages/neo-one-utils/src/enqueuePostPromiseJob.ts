const resolvedPromise = Promise.resolve();
// tslint:disable
export const enqueuePostPromiseJob =
  typeof process === 'object' && typeof process.nextTick === 'function'
    ? (fn: () => void) => {
        resolvedPromise.then(() => process.nextTick(fn));
      }
    : setImmediate || setTimeout;
// tslint:enable
