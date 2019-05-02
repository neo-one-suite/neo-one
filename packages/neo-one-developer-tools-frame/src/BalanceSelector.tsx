// tslint:disable no-object-mutation
import { nep5 } from '@neo-one/client-core';
import { Box, usePrevious, useStream } from '@neo-one/react-common';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import * as React from 'react';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { DeveloperToolsContext, useTokens } from './DeveloperToolsContext';
import { useAddError } from './ToastsContext';
import { ToolbarSelector } from './ToolbarSelector';
import { Asset, ASSETS, getTokenAsset } from './transferCommon';
import { Token } from './types';

const { useContext } = React;

// tslint:disable-next-line no-any
const AssetInput: any = styled(ToolbarSelector)`
  &&& {
    border-left: 0;
    width: 88px;
  }
`;

const Wrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  background-color: ${prop('theme.gray0')};
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  border-left: 1px solid rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(0, 0, 0, 0.3);
  padding: 0 8px;
`;

const assetGlobal$ = new BehaviorSubject(ASSETS[0]);
const onChangeAsset = (asset: Asset) => {
  assetGlobal$.next(asset);
};

const getAsset = (tokens: readonly Token[], prevTokens: readonly Token[] | undefined, asset: Asset) => {
  if (prevTokens === undefined || prevTokens === tokens) {
    return asset;
  }

  if (prevTokens.length > tokens.length) {
    if (asset.type === 'token' && !tokens.some((token) => token.address === asset.token.address)) {
      return tokens.length === 0 ? ASSETS[0] : getTokenAsset(tokens[0]);
    }

    return asset;
  }

  if (prevTokens.length < tokens.length) {
    return getTokenAsset(tokens[tokens.length - 1]);
  }

  return asset;
};

export function BalanceSelector() {
  const addError = useAddError();
  const [tokens] = useTokens();
  const prevTokens = usePrevious(tokens);
  const asset = getAsset(tokens, prevTokens, useStream(() => assetGlobal$, [assetGlobal$], assetGlobal$.getValue()));

  const { client, accountState$ } = useContext(DeveloperToolsContext);
  const value = useStream(
    () =>
      accountState$.pipe(filter(utils.notNull)).pipe(
        switchMap(async ({ currentUserAccount, account }) => {
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
      ),
    [addError, accountState$, asset, tokens],
  );

  return (
    <>
      <Wrapper data-test="neo-one-balance-selector-value">{value}</Wrapper>
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
    </>
  );
}
