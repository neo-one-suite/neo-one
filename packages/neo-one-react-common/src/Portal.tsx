import * as React from 'react';
import * as ReactDOM from 'react-dom';

const { useState, useEffect } = React;

export const Portal = ({ children }: { readonly children: React.ReactNode }) => {
  const [wrapper] = useState(() => {
    // tslint:disable-next-line strict-type-predicates
    if (typeof document !== 'undefined') {
      const wrapperIn = document.createElement('div');
      document.body.appendChild(wrapperIn);

      return wrapperIn;
    }

    return undefined;
  });
  useEffect(
    () => () => {
      if (wrapper !== undefined) {
        document.body.removeChild(wrapper);
      }
    },
    [wrapper],
  );

  if (wrapper === undefined) {
    // tslint:disable-next-line:no-null-keyword
    return null;
  }

  return ReactDOM.createPortal(children, wrapper);
};
