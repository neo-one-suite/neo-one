// tslint:disable no-null-keyword no-any
import { createPrivateKey } from '@neo-one/client-common';
import { LocalKeyStore } from '@neo-one/client-core';
import { Box, Button, useStream } from '@neo-one/react-common';
import * as React from 'react';
import { combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, map } from 'rxjs/operators';
import styled from 'styled-components';
import { DeveloperToolsContext, useTokens } from './DeveloperToolsContext';
import { useAddError } from './ToastsContext';
import { getWalletSelectorOptions$, makeWalletSelectorValueOption, WalletSelectorBase } from './WalletSelectorBase';

const { useContext } = React;

const WalletSelectorWrapper = styled(Box)`
  display: grid;
  grid:
    'selector button' auto
    / minmax(96px, 1fr) auto;
  gap: 8px;
`;

const AddressWrapper = styled(Box)`
  display: grid;
  grid-template-columns: 'auto 1fr';
  gap: 8;
`;

export function WalletSelector(props: any) {
  const addError = useAddError();
  const [tokens] = useTokens();
  const { client, currentUserAccount$, userAccounts$, block$ } = useContext(DeveloperToolsContext);
  const [selectedUserAccount, options] = useStream(
    () =>
      combineLatest(
        currentUserAccount$.pipe(
          distinctUntilChanged(),
          map((value) => (value === undefined ? value : makeWalletSelectorValueOption({ userAccount: value }))),
        ),
        getWalletSelectorOptions$(addError, client, userAccounts$, block$, tokens),
      ).pipe(
        catchError((error) => {
          addError(error);

          // tslint:disable-next-line no-any
          return of<any>([undefined, []]);
        }),
      ),
    [client, currentUserAccount$, userAccounts$, block$, addError, tokens],
  );

  let newWalletOnClick: (() => void) | undefined;
  if (client.providers.localStorage !== undefined && client.providers.localStorage.keystore !== undefined) {
    const keystore = client.providers.localStorage.keystore;
    if (keystore instanceof LocalKeyStore) {
      newWalletOnClick = () => {
        keystore
          .addUserAccount({
            network: client.getCurrentNetwork(),
            privateKey: createPrivateKey(),
          })
          .then(async (wallet) => client.selectUserAccount(wallet.userAccount.id))
          .catch(addError);
      };
    }
  }
  if (
    newWalletOnClick === undefined &&
    client.providers.memory !== undefined &&
    client.providers.memory.keystore !== undefined
  ) {
    const keystore = client.providers.memory.keystore;
    if (keystore instanceof LocalKeyStore) {
      newWalletOnClick = () => {
        keystore
          .addUserAccount({
            network: client.getCurrentNetwork(),
            privateKey: createPrivateKey(),
          })
          .then(async (wallet) => client.selectUserAccount(wallet.userAccount.id))
          .catch(addError);
      };
    }
  }

  const newWalletButton =
    // tslint:disable-next-line no-null-keyword
    newWalletOnClick === undefined ? null : (
      <Button data-test="neo-one-wallet-selector-new-button" onClick={newWalletOnClick}>
        New Wallet
      </Button>
    );

  return (
    <>
      <WalletSelectorWrapper>
        <WalletSelectorBase
          data-test="neo-one-wallet-selector-selector"
          {...props}
          value={selectedUserAccount}
          options={options}
          onChange={(option: any) => {
            if (option != undefined && !Array.isArray(option)) {
              client.selectUserAccount(option.id).catch(addError);
            }
          }}
        />
        {newWalletButton}
      </WalletSelectorWrapper>
      {selectedUserAccount === undefined ? null : (
        <AddressWrapper>
          <Box>Address:</Box>
          <Box>{selectedUserAccount.address}</Box>
        </AddressWrapper>
      )}
    </>
  );
}
