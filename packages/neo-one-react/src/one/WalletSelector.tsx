// tslint:disable no-null-keyword
import { createPrivateKey, LocalKeyStore } from '@neo-one/client';
import * as React from 'react';
import Select from 'react-select';
import { Grid, styled } from 'reakit';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { FromStream } from '../FromStream';
import { ComponentProps } from '../types';
import { Button } from './Button';
import { DeveloperToolsContext, WithTokens } from './DeveloperToolsContext';
import { getOptions$, makeValueOption, OptionType, WalletSelectorBase } from './WalletSelectorBase';
import { WithAddError } from './WithAddError';

const Wrapper = styled(Grid)`
  align-items: center;
  margin: 16px 0;
`;

export function WalletSelector(props: ComponentProps<Select<OptionType>>) {
  return (
    <WithAddError>
      {(addError) => (
        <WithTokens>
          {(tokens$) => (
            <DeveloperToolsContext.Consumer>
              {({ client }) => (
                <FromStream
                  props$={combineLatest(
                    client.currentAccount$.pipe(
                      distinctUntilChanged(),
                      map((value) => (value === undefined ? value : makeValueOption({ userAccount: value }))),
                    ),
                    getOptions$(addError, client, tokens$),
                  )}
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
                            .then(async (wallet) => client.selectAccount(wallet.account.id))
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
                            .then(async (wallet) => client.selectAccount(wallet.account.id))
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
                      <Wrapper gap={8}>
                        <Grid gap={16} gridAutoFlow="column">
                          <WalletSelectorBase
                            data-test="neo-one-wallet-selector-selector"
                            {...props}
                            value={value}
                            options={options}
                            onChange={(option) => {
                              if (option != undefined && !Array.isArray(option)) {
                                client.selectAccount(option.id).catch(addError);
                              }
                            }}
                          />
                          {newWalletButton}
                        </Grid>
                        {value === undefined ? null : (
                          <Grid columns="auto 1fr" gap={8}>
                            <Grid.Item>Address:</Grid.Item>
                            <Grid.Item>{value.address}</Grid.Item>
                          </Grid>
                        )}
                      </Wrapper>
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
