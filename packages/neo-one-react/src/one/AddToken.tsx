import { Client, nep5 } from '@neo-one/client';
import { Button, TextInput, Token, WithAddError } from '@neo-one/react-common';
import { EffectMap } from 'constate';
import * as React from 'react';
import { Container, Grid, styled } from 'reakit';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { ReactSyntheticEvent } from '../types';
import {
  DeveloperToolsContext,
  DeveloperToolsContextType,
  WithOnChangeTokens,
  WithTokens,
} from './DeveloperToolsContext';

interface State {
  readonly disabled: boolean;
  readonly address: string;
}

interface Effects {
  readonly onChangeAddress: (event: ReactSyntheticEvent) => void;
  readonly submit: () => void;
}

const INITIAL_STATE = {
  disabled: false,
  address: '',
};

const makeEffects = (
  client: Client,
  tokens$: Observable<ReadonlyArray<Token>>,
  onChange: (tokens: ReadonlyArray<Token>) => void,
  addError: (error: Error) => void,
): EffectMap<State, Effects> => ({
  onChangeAddress: (event) => {
    const address = event.currentTarget.value;

    return ({ setState }) => {
      setState({ address });
    };
  },
  submit: () => ({ state, setState }) => {
    setState({ disabled: true });
    Promise.resolve()
      .then(async () => {
        const network = client.getCurrentNetwork();
        const decimals = await nep5.getDecimals(client, { [network]: { address: state.address } }, network);
        const smartContract = nep5.createNEP5SmartContract(client, { [network]: { address: state.address } }, decimals);
        const symbol = await smartContract.symbol({ network });
        const tokens = await tokens$.pipe(take(1)).toPromise();

        onChange(tokens.concat({ network, address: state.address, decimals, symbol }));
        setState({ disabled: false, address: '' });
      })
      .catch((error) => {
        addError(error);
        setState({ disabled: false });
      });
  },
});

const Wrapper = styled(Grid)`
  grid-auto-flow: column;
  gap: 8px;
`;

export function AddToken(props: {}) {
  return (
    <DeveloperToolsContext.Consumer>
      {({ client }: DeveloperToolsContextType) => (
        <WithTokens>
          {(tokens$) => (
            <WithOnChangeTokens>
              {(onChange) => (
                <WithAddError>
                  {(addError) => (
                    <Container initialState={INITIAL_STATE} effects={makeEffects(client, tokens$, onChange, addError)}>
                      {({ address, disabled, submit, onChangeAddress }) => (
                        <Wrapper {...props}>
                          <TextInput
                            data-test="neo-one-add-token-input"
                            placeholder="Token Address"
                            value={address}
                            onChange={onChangeAddress}
                          />
                          <Button data-test="neo-one-add-token-button" onClick={submit} disabled={disabled}>
                            Add Token
                          </Button>
                        </Wrapper>
                      )}
                    </Container>
                  )}
                </WithAddError>
              )}
            </WithOnChangeTokens>
          )}
        </WithTokens>
      )}
    </DeveloperToolsContext.Consumer>
  );
}
