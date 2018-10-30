// tslint:disable rxjs-finnish
import { iif, Observable, throwError, timer } from 'rxjs';
import { concatMap, retryWhen } from 'rxjs/operators';

export interface RetryBackoffConfig {
  // Initial interval. It will eventually go as high as maxInterval.
  readonly initialInterval: number;
  // Maximum number of retry attempts.
  readonly maxRetries?: number;
  // Maximum delay between retries.
  readonly maxInterval?: number;
  // Conditional retry.
  readonly shouldRetry?: (error: Error) => boolean;
  readonly backoffDelay?: (iteration: number, initialInterval: number) => number;
  readonly onError?: (error: Error) => void;
}

/** Calculates the actual delay which can be limited by maxInterval */
function getDelay(backoffDelay: number, maxInterval: number) {
  return Math.min(backoffDelay, maxInterval);
}

/** Exponential backoff delay */
function exponentialBackoffDelay(iteration: number, initialInterval: number) {
  return Math.pow(2, iteration) * initialInterval;
}

/**
 * Returns an Observable that mirrors the source Observable with the exception
 * of an error. If the source Observable calls error, rather than propagating
 * the error call this method will resubscribe to the source Observable with
 * exponentially increasing interval and up to a maximum of count
 * resubscriptions (if provided). Retrying can be cancelled at any point if
 * shouldRetry returns false.
 */
export function retryBackoff(config: number | RetryBackoffConfig): <T>(source: Observable<T>) => Observable<T> {
  const {
    initialInterval,
    maxRetries = Infinity,
    maxInterval = Infinity,
    shouldRetry = () => true,
    backoffDelay = exponentialBackoffDelay,
    onError = () => {
      // do nothing
    },
  } = typeof config === 'number' ? { initialInterval: config } : config;

  return <T>(source: Observable<T>) =>
    source.pipe(
      retryWhen<T>((errors) =>
        errors.pipe(
          concatMap((error, i) => {
            onError(error);

            return iif(
              () => i < maxRetries && shouldRetry(error),
              timer(getDelay(backoffDelay(i, initialInterval), maxInterval)),
              throwError(error),
            );
          }),
        ),
      ),
    );
}
