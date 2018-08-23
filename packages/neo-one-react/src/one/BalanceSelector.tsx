import { nep5 } from '@neo-one/client';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import * as React from 'react';
import { Container, Flex, styled } from 'reakit';
import { of } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';
import { prop } from 'styled-tools';
import { FromStream } from '../FromStream';
import { DeveloperToolsContext, WithTokens } from './DeveloperToolsContext';
import { WithAddError } from './ErrorsContainer';
import { ToolbarSelector } from './ToolbarSelector';
import { Asset, ASSETS, TokenAsset } from './TransferContainer';

interface State {
  readonly asset: Asset;
}

const actions = {
  onChangeAsset: (asset: Asset) => ({ asset }),
};

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
  return (
    <WithAddError>
      {(addError) => (
        <Container initialState={{ asset: ASSETS[0] }} actions={actions}>
          {({ asset, onChangeAsset }: State & typeof actions) => (
            <>
              <DeveloperToolsContext.Consumer>
                {({ client }) => (
                  <FromStream
                    props$={client.accountState$.pipe(
                      filter(utils.notNull),
                      switchMap(async ({ currentAccount, account }) => {
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
                    {(value) => <Wrapper>{value}</Wrapper>}
                  </FromStream>
                )}
              </DeveloperToolsContext.Consumer>
              <WithTokens>
                {(tokens) => (
                  <AssetInput
                    help="Select Coin"
                    value={asset}
                    options={ASSETS.concat(
                      tokens.map<TokenAsset>((token) => ({
                        type: 'token',
                        token,
                        label: token.symbol,
                        value: token.address,
                      })),
                    )}
                    onChange={(option: Asset | Asset[] | undefined | null) => {
                      if (option != undefined && !Array.isArray(option)) {
                        onChangeAsset(option);
                      }
                    }}
                  />
                )}
              </WithTokens>
            </>
          )}
        </Container>
      )}
    </WithAddError>
  );
}
