import { nep5 } from '@neo-one/client';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import * as React from 'react';
import { Flex, styled } from 'reakit';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, scan, switchMap } from 'rxjs/operators';
import { prop } from 'styled-tools';
import { FromStream } from '../FromStream';
import { DeveloperToolsContext, Token, WithTokens } from './DeveloperToolsContext';
import { Pure } from './Pure';
import { ToolbarSelector } from './ToolbarSelector';
import { Asset, ASSETS, getTokenAsset } from './TransferContainer';
import { WithAddError } from './WithAddError';

// tslint:disable-next-line no-any
const AssetInput: any = styled(ToolbarSelector)`
  border-left: 0;
  width: 88px;
`;

const Wrapper = styled(Flex)`
  align-items: center;
  background-color: ${prop('theme.gray0')};
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  border-left: 1px solid rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(0, 0, 0, 0.3);
  padding: 0 8px;
`;

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
            {(tokens$) => {
              const currentAssetTokens$ = combineLatest(tokens$, asset$).pipe(
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

              const currentAsset$ = currentAssetTokens$.pipe(
                filter(utils.notNull),
                map(({ asset }) => asset),
                distinctUntilChanged(),
              );

              return (
                <>
                  <DeveloperToolsContext.Consumer>
                    {({ client }) => (
                      <FromStream
                        props$={combineLatest(currentAsset$, client.accountState$.pipe(filter(utils.notNull))).pipe(
                          switchMap(async ([asset, { currentAccount, account }]) => {
                            if (asset.type === 'token') {
                              const smartContract = nep5.createNEP5ReadSmartContract(
                                client.read(asset.token.network),
                                asset.token.address,
                                asset.token.decimals,
                              );
                              const tokenBalance = await smartContract.balanceOf(currentAccount.id.address);

                              return tokenBalance.toFormat();
                            }

                            const balance = account.balances[asset.value] as BigNumber | undefined;

                            return balance === undefined ? '0' : balance.toFormat();
                          }),
                          catchError((error: Error) => {
                            addError(error);

                            return of('0');
                          }),
                        )}
                      >
                        {(value) => <Wrapper data-test="neo-one-balance-selector-value">{value}</Wrapper>}
                      </FromStream>
                    )}
                  </DeveloperToolsContext.Consumer>
                  <FromStream props$={currentAssetTokens$}>
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
              );
            }}
          </WithTokens>
        </Pure>
      )}
    </WithAddError>
  );
}
