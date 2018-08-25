import { ActionMap, ComposableContainer } from 'constate';
import _ from 'lodash';
import * as React from 'react';
import { Container } from 'reakit';

interface State {
  readonly toasts: ReadonlyArray<Toast>;
}

export interface Toast {
  readonly id: string;
  readonly title: React.ReactNode;
  readonly message: React.ReactNode;
  readonly autoHide?: number;
}

interface Actions {
  readonly addToast: AddToast;
  readonly removeToast: (id: string) => void;
}

export type AddToast = (toast: Toast) => void;

const actions: ActionMap<State, Actions> = {
  addToast: (toast) => ({ toasts }) => ({
    toasts: toasts.some((localToast) => localToast.id === toast.id) ? toasts : [...toasts, toast],
  }),
  removeToast: (id) => ({ toasts }) => ({ toasts: toasts.filter((localToast) => localToast.id !== id) }),
};

export const ToastsContainer: ComposableContainer<State, Actions> = (props) => (
  <Container
    {...props}
    context="toasts"
    actions={actions}
    shouldUpdate={({ state, nextState }: { state: State; nextState: State }) => !_.isEqual(state, nextState)}
  />
);

interface WithAddToastPureProps {
  readonly addToast: AddToast;
  readonly children: (addToast: AddToast) => React.ReactNode;
}

export class WithAddToastPure extends React.Component<WithAddToastPureProps> {
  public shouldComponentUpdate(nextProps: WithAddToastPureProps) {
    return this.props.children !== nextProps.children;
  }

  public render() {
    return this.props.children(this.props.addToast);
  }
}

interface WithAddToastProps {
  readonly children: (addToast: AddToast) => React.ReactNode;
}

export function WithAddToast({ children }: WithAddToastProps) {
  return (
    <ToastsContainer>
      {({ addToast }) => <WithAddToastPure addToast={addToast}>{children}</WithAddToastPure>}
    </ToastsContainer>
  );
}
