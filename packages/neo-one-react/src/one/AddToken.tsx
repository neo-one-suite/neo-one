import { Client, nep5 } from '@neo-one/client';
import { EffectMap } from 'constate';
import * as React from 'react';
import { Container, Flex, styled } from 'reakit';
import { ReactSyntheticEvent } from '../types';
import { Button } from './Button';
import { DeveloperToolsContext, Token, WithOnChangeTokens, WithTokens } from './DeveloperToolsContext';
import { WithAddError } from './ErrorsContainer';
import { TextInput } from './TextInput';

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
  tokens: ReadonlyArray<Token>,
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
        const readClient = client.read(network);
        const decimals = await nep5.getDecimals(readClient, state.address);
        const smartContract = nep5.createNEP5ReadSmartContract(readClient, state.address, decimals);
        const symbol = await smartContract.symbol();

        onChange(tokens.concat({ network, address: state.address, decimals, symbol }));
        setState({ disabled: false, address: '' });
      })
      .catch((error) => {
        addError(error);
        setState({ disabled: false });
      });
  },
});

const Wrapper = styled(Flex)`
  margin: 16px 0;
`;

const StyledButton = styled(Button)`
  margin-left: 8px;
`;

export function AddToken() {
  return (
    <DeveloperToolsContext.Consumer>
      {({ client }) => (
        <WithTokens>
          {(tokens) => (
            <WithOnChangeTokens>
              {(onChange) => (
                <WithAddError>
                  {(addError) => (
                    <Container initialState={INITIAL_STATE} effects={makeEffects(client, tokens, onChange, addError)}>
                      {({ address, disabled, submit, onChangeAddress }) => (
                        <Wrapper>
                          <TextInput placeholder="Token Address" value={address} onChange={onChangeAddress} />
                          <StyledButton onClick={submit} disabled={disabled}>
                            Add Token
                          </StyledButton>
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
