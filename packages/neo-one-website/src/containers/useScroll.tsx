import * as React from 'react';

const { useState, useMemo, useEffect } = React;

export const useScroll = () => {
  // tslint:disable-next-line strict-type-predicates
  const [x, setX] = useState(typeof window === 'undefined' ? 0 : window.scrollX);
  // tslint:disable-next-line strict-type-predicates
  const [y, setY] = useState(typeof window === 'undefined' ? 0 : window.scrollY);
  const handler = useMemo(
    () => () => {
      setX(window.scrollX);
      setY(window.scrollY);
    },
    [],
  );
  useEffect(() => {
    // tslint:disable-next-line strict-type-predicates
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handler);
    }

    return () => {
      // tslint:disable-next-line strict-type-predicates
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handler);
      }
    };
  });

  return [x, y];
};
