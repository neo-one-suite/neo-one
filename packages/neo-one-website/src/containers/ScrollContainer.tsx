import { ContainerProps } from 'constate';
import * as React from 'react';
import { Container } from 'reakit';

const getScrollPosition = (element: typeof window) => ({
  y: element.scrollY,
  x: element.scrollX,
});

// tslint:disable-next-line strict-type-predicates
const initialState = typeof window === 'undefined' ? { y: 0, x: 0 } : getScrollPosition(window);

type State = ReturnType<typeof getScrollPosition> & {
  readonly handler: () => void;
};

const onMount = ({ setState }: { readonly setState: (state: Partial<State>) => void }) => {
  const handler = () => setState(getScrollPosition(window));
  // tslint:disable-next-line strict-type-predicates
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handler);
  }
  setState({ handler });
};

const onUnmount = ({ state }: { readonly state: State }) => {
  // tslint:disable-next-line strict-type-predicates
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', state.handler);
  }
};

export const ScrollContainer = (props: ContainerProps<State>) => (
  <Container {...props} initialState={initialState} onMount={onMount} onUnmount={onUnmount} />
);
