import { nep5 } from '@neo-one/client-core';
import { FromStream } from '@neo-one/react';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import * as React from 'react';
import { Grid, styled } from 'reakit';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, scan, switchMap } from 'rxjs/operators';
import { prop } from 'styled-tools';
import { DeveloperToolsContext, DeveloperToolsContextType, WithTokens } from './DeveloperToolsContext';
import { Pure } from './Pure';
import { ToolbarSelector } from './ToolbarSelector';
import { Asset, ASSETS, getTokenAsset } from './TransferContainer';
import { Token } from './types';
import { WithAddError } from './WithAddError';

// tslint:disable-next-line no-any
const AssetInput: any = styled(ToolbarSelector)`
  &&& {
    border-left: 0;
    width: 88px;
  }
`;

const Wrapper = styled(Grid)`
  grid-auto-flow: column;
  align-items: center;
  background-color: ${prop('theme.gray0')};
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  border-left: 1px solid rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(0, 0, 0, 0.3);
  padding: 0 8px;
`;

interface CurrentAssetTokenOptions {
  readonly asset$: Observable<Asset>;
  readonly tokens$: Observable<ReadonlyArray<Token>>;
}

const createCurrentAssetToken$ = ({ asset$, tokens$ }: CurrentAssetTokenOptions) =>
  combineLatest(tokens$, asset$).pipe(
    scan<[ReadonlyArray<Token>, Asset], { tokens: ReadonlyArray<Token>; asset: Asset } | undefined>(
      (prev, [tokens, asset]) => {
        const simple = { tokens, asset };
        if (prev === undefined || prev.tokens === tokens) {
          return simple;
        }

        if (prev.tokens === tokens) {
          return simple;
        }

        if (prev.tokens.length > tokens.length) {
          if (asset.type === 'token' && !tokens.some((token) => token.address === asset.token.address)) {
            return { tokens, asset: tokens.length === 0 ? ASSETS[0] : getTokenAsset(tokens[0]) };
          }

          return simple;
        }

        if (prev.tokens.length < tokens.length) {
          return { tokens, asset: getTokenAsset(tokens[tokens.length - 1]) };
        }

        return simple;
      },
      undefined,
    ),
    filter(utils.notNull),
  );

const createCurrentAsset$ = (options: CurrentAssetTokenOptions) =>
  createCurrentAssetToken$(options).pipe(
    filter(utils.notNull),
    map(({ asset }) => asset),
    distinctUntilChanged(),
  );

export function BalanceSelector() {
  const asset$ = new BehaviorSubject(ASSETS[0]);
  const onChangeAsset = (asset: Asset) => {
    asset$.next(asset);
  };

  return (
    <WithAddError>
      {(addError) => (
        <Pure>
          <WithTokens>
            {(tokens$) => (
              <>
                <DeveloperToolsContext.Consumer>
                  {({ client, accountState$ }: DeveloperToolsContextType) => (
                    <FromStream
                      props={[addError, accountState$, asset$, tokens$]}
                      createStream={() =>
                        combineLatest(
                          createCurrentAsset$({ asset$, tokens$ }),
                          accountState$.pipe(filter(utils.notNull)),
                        ).pipe(
                          switchMap(async ([asset, { currentUserAccount, account }]) => {
                            if (asset.type === 'token') {
                              const smartContract = nep5.createNEP5SmartContract(
                                client,
                                { [asset.token.network]: { address: asset.token.address } },
                                asset.token.decimals,
                              );
                              const tokenBalance = await smartContract.balanceOf(currentUserAccount.id.address, {
                                network: asset.token.network,
                              });

                              return tokenBalance.toFormat();
                            }

                            const balance = account.balances[asset.value] as BigNumber | undefined;

                            return balance === undefined ? '0' : balance.toFormat();
                          }),
                          catchError((error: Error) => {
                            addError(error);

                            return of('0');
                          }),
                        )
                      }
                    >
                      {(value) => <Wrapper data-test="neo-one-balance-selector-value">{value}</Wrapper>}
                    </FromStream>
                  )}
                </DeveloperToolsContext.Consumer>
                <FromStream
                  props={[asset$, tokens$]}
                  createStream={() => createCurrentAssetToken$({ asset$, tokens$ })}
                >
                  {({ tokens, asset }) => (
                    <AssetInput
                      data-test-selector="neo-one-balance-selector-selector"
                      data-test-container="neo-one-balance-selector-container"
                      data-test-tooltip="neo-one-balance-selector-tooltip"
                      help="Select Coin"
                      value={asset}
                      options={ASSETS.concat(tokens.map(getTokenAsset))}
                      onChange={(option: Asset | Asset[] | undefined | null) => {
                        if (option != undefined && !Array.isArray(option)) {
                          onChangeAsset(option);
                        }
                      }}
                    />
                  )}
                </FromStream>
              </>
            )}
          </WithTokens>
        </Pure>
      )}
    </WithAddError>
  );
}
