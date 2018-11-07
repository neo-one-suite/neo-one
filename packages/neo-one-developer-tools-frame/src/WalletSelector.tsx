// tslint:disable no-null-keyword no-any
import { createPrivateKey } from '@neo-one/client-common';
import { LocalKeyStore } from '@neo-one/client-core';
import { FromStream } from '@neo-one/react';
import { Button } from '@neo-one/react-common';
import * as React from 'react';
import { Grid, styled } from 'reakit';
import { combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, map } from 'rxjs/operators';
import { DeveloperToolsContext, DeveloperToolsContextType, WithTokens } from './DeveloperToolsContext';
import { getWalletSelectorOptions$, makeWalletSelectorValueOption, WalletSelectorBase } from './WalletSelectorBase';
import { WithAddError } from './WithAddError';

const WalletSelectorWrapper = styled(Grid)`
  grid:
    'selector button' auto
    / minmax(96px, 1fr) auto;
  gap: 8px;
`;

export function WalletSelector(props: any) {
  return (
    <WithAddError>
      {(addError) => (
        <WithTokens>
          {(tokens$) => (
            <DeveloperToolsContext.Consumer>
              {({ client, currentUserAccount$, userAccounts$, block$ }: DeveloperToolsContextType) => (
                <FromStream
                  props={[client, currentUserAccount$, userAccounts$, block$, addError, tokens$]}
                  createStream={() =>
                    combineLatest(
                      currentUserAccount$.pipe(
                        distinctUntilChanged(),
                        map((value) =>
                          value === undefined ? value : makeWalletSelectorValueOption({ userAccount: value }),
                        ),
                      ),
                      getWalletSelectorOptions$(addError, client, userAccounts$, block$, tokens$),
                    ).pipe(
                      catchError((error) => {
                        addError(error);

                        // tslint:disable-next-line no-any
                        return of<any>([undefined, []]);
                      }),
                    )
                  }
                >
                  {([value, options]) => {
                    let newWalletOnClick: (() => void) | undefined;
                    if (
                      client.providers.localStorage !== undefined &&
                      client.providers.localStorage.keystore !== undefined
                    ) {
                      const keystore = client.providers.localStorage.keystore;
                      if (keystore instanceof LocalKeyStore) {
                        newWalletOnClick = () => {
                          keystore
                            .addAccount({
                              network: client.getCurrentNetwork(),
                              privateKey: createPrivateKey(),
                            })
                            .then(async (wallet) => client.selectUserAccount(wallet.account.id))
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
                            .addAccount({
                              network: client.getCurrentNetwork(),
                              privateKey: createPrivateKey(),
                            })
                            .then(async (wallet) => client.selectUserAccount(wallet.account.id))
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
                            value={value}
                            options={options}
                            onChange={(option: any) => {
                              if (option != undefined && !Array.isArray(option)) {
                                client.selectUserAccount(option.id).catch(addError);
                              }
                            }}
                          />
                          {newWalletButton}
                        </WalletSelectorWrapper>
                        {value === undefined ? null : (
                          <Grid columns="auto 1fr" gap={8}>
                            <Grid.Item>Address:</Grid.Item>
                            <Grid.Item>{value.address}</Grid.Item>
                          </Grid>
                        )}
                      </>
                    );
                  }}
                </FromStream>
              )}
            </DeveloperToolsContext.Consumer>
          )}
        </WithTokens>
      )}
    </WithAddError>
  );
}
