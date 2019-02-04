// tslint:disable no-object-mutation
import { DependencyList, useEffect, useMemo, useRef, useState } from 'react';
import { Observable, Subscription } from 'rxjs';

export function useStream<T>(createStream$: () => Observable<T>, props: DependencyList, initialValue?: T): T {
  const subscriptionRef = useRef<Subscription | undefined>(undefined);
  const setValueRef = useRef<((value: T) => void) | undefined>(undefined);
  // Subscribe during the first render in case there is a synchronous result.
  const first = useMemo(() => {
    if (subscriptionRef.current !== undefined) {
      subscriptionRef.current.unsubscribe();
    }

    let firstValue = initialValue;
    subscriptionRef.current = createStream$().subscribe({
      next: (nextValue) => {
        firstValue = nextValue;
        if (setValueRef.current !== undefined) {
          setValueRef.current(nextValue);
        }
      },
    });

    return firstValue;
  }, props);
  // Make sure we do a final cleanup of the subscription
  useEffect(
    () => () => {
      if (subscriptionRef.current !== undefined) {
        subscriptionRef.current.unsubscribe();
      }
    },
    [],
  );
  const [value, setValue] = useState<T | undefined>(first);
  setValueRef.current = setValue;

  return value as T;
}
