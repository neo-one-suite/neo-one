import _ from 'lodash';
import * as React from 'react';
import { Container } from 'reakit';

interface State {
  readonly errors: ReadonlyArray<string>;
}

type AddError = (error: Error) => void;

interface RenderProps extends State {
  readonly addError: AddError;
  readonly removeError: (error: string) => void;
}

const actions = {
  addError: (error: Error) => ({ errors }: State) => {
    // tslint:disable-next-line no-console
    console.error(error);

    return {
      errors: errors.includes(error.message) ? errors : [...errors, error.message],
    };
  },
  removeError: (error: string) => ({ errors }: State) => ({ errors: errors.filter((err) => err !== error) }),
};

interface Props {
  readonly children: (props: RenderProps) => React.ReactNode;
}
export function ErrorsContainer({ children }: Props) {
  return (
    <Container
      context="errors"
      actions={actions}
      shouldUpdate={({ state, nextState }: { state: State; nextState: State }) => !_.isEqual(state, nextState)}
    >
      {children}
    </Container>
  );
}

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
