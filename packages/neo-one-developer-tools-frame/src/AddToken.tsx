import { nep5 } from '@neo-one/client-core';
import { Box, Button, TextInput } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { DeveloperToolsContext, useTokens } from './DeveloperToolsContext';
import { useAddError } from './ToastsContext';

const { useContext, useState, useCallback } = React;

const Wrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  gap: 8px;
`;

export function AddToken(props: {}) {
  const { client } = useContext(DeveloperToolsContext);
  const [tokens, onChangeTokens] = useTokens();
  const addError = useAddError();
  const [disabled, setDisabled] = useState(false);
  const [address, setAddress] = useState('');
  const submit = useCallback(() => {
    setDisabled(true);
    Promise.resolve()
      .then(async () => {
        const network = client.getCurrentNetwork();
        const decimals = await nep5.getDecimals(client, { [network]: { address } }, network);
        const smartContract = nep5.createNEP5SmartContract(client, { [network]: { address } }, decimals);
        const symbol = await smartContract.symbol({ network });

        onChangeTokens(tokens.concat({ network, address, decimals, symbol }));
        setDisabled(false);
        setAddress('');
      })
      .catch((error) => {
        addError(error);
        setDisabled(false);
      });
  }, [setDisabled, client, address, tokens, onChangeTokens, addError]);
  const onChangeAddress = useCallback(
    (event) => {
      setAddress(event.currentTarget.value);
    },
    [setAddress],
  );

  return (
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
  );
}
