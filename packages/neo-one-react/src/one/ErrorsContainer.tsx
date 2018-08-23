import { ActionMap, ComposableContainer } from 'constate';
import _ from 'lodash';
import * as React from 'react';
import { Container } from 'reakit';

interface State {
  readonly errors: ReadonlyArray<string>;
}

interface Actions {
  readonly addError: (error: Error) => void;
  readonly removeError: (error: string) => void;
}

type AddError = (error: Error) => void;

const actions: ActionMap<State, Actions> = {
  addError: (error) => ({ errors }) => {
    // tslint:disable-next-line no-console
    console.error(error);

    return {
      errors: errors.includes(error.message) ? errors : [...errors, error.message],
    };
  },
  removeError: (error) => ({ errors }) => ({ errors: errors.filter((err) => err !== error) }),
};

export const ErrorsContainer: ComposableContainer<State, Actions> = (props) => (
  <Container
    {...props}
    context="errors"
    actions={actions}
    shouldUpdate={({ state, nextState }: { state: State; nextState: State }) => !_.isEqual(state, nextState)}
  />
);

interface WithAddErrorPureProps {
  readonly addError: AddError;
  readonly children: (addError: AddError) => React.ReactNode;
}

export class WithAddErrorPure extends React.PureComponent<WithAddErrorPureProps> {
  public render() {
    return this.props.children(this.props.addError);
  }
}

interface WithAddErrorProps {
  readonly children: (addError: AddError) => React.ReactNode;
}

export function WithAddError({ children }: WithAddErrorProps) {
  return (
    <ErrorsContainer>
      {({ addError }) => <WithAddErrorPure addError={addError}>{children}</WithAddErrorPure>}
    </ErrorsContainer>
  );
}
