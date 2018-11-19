import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    // tslint:disable-next-line:no-object-mutation
    ref.current = value;
  });

  return ref.current;
}
