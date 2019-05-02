// tslint:disable no-any
import { Account, UserAccount } from '@neo-one/client-common';
import { Client, Hash256, nep5 } from '@neo-one/client-core';
import { Box, Select } from '@neo-one/react-common';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import * as React from 'react';
// tslint:disable-next-line no-submodule-imports
import { FormatOptionLabelMeta } from 'react-select/lib/Select';
import { combineLatest, concat, of, ReplaySubject } from 'rxjs';
import { catchError, distinctUntilChanged, map, multicast, refCount, switchMap, take } from 'rxjs/operators';
import styled from 'styled-components';
import { Token } from './types';

export const makeOption = async ({
  client,
  userAccount,
  account,
  tokens,
}: {
  readonly client: Client;
  readonly userAccount: UserAccount;
  readonly account: Account;
  readonly tokens: readonly Token[];
}) => {
  const [assetBalances, tokenBalances] = await Promise.all([
    Promise.all(
      Object.entries(account.balances).map<Promise<[string, BigNumber] | undefined>>(async ([assetHash, value]) => {
        if (assetHash === Hash256.NEO) {
          return ['NEO', value];
        }

        if (assetHash === Hash256.GAS) {
          return ['GAS', value];
        }

        return undefined;
      }),
    ),
    Promise.all(
      tokens
        .filter((token) => token.network === userAccount.id.network)
        .map<Promise<[string, BigNumber]>>(async (token) => {
          const smartContract = nep5.createNEP5SmartContract(
            client,
            { [token.network]: { address: token.address } },
            token.decimals,
          );

          const balance = await smartContract.balanceOf(userAccount.id.address, { network: token.network });

          return [token.symbol, balance];
        }),
    ),
  ]);

  return {
    value: `${userAccount.id.network}:${userAccount.id.address}`,
    label: userAccount.name,
    address: userAccount.id.address,
    id: userAccount.id,
    userAccount,
    // tslint:disable-next-line no-array-mutation
    balances: assetBalances
      .filter(utils.notNull)
      .concat(tokenBalances)
      .sort(([nameA], [nameB]) => {
        if (nameA.localeCompare(nameB) === 0) {
          return 0;
        }

        if (nameA === 'NEO') {
          return -1;
        }

        if (nameB === 'NEO') {
          return 1;
        }

        if (nameA === 'GAS') {
          return -1;
        }

        if (nameB === 'GAS') {
          return 1;
        }

        return nameA.localeCompare(nameB);
      }),
  };
};

export const makeWalletSelectorValueOption = ({ userAccount }: { readonly userAccount: UserAccount }) => ({
  value: `${userAccount.id.network}:${userAccount.id.address}`,
  label: userAccount.name,
  address: userAccount.id.address,
  id: userAccount.id,
  userAccount,
});

export type WalletSelectorOptionType =
  | PromiseReturnType<typeof makeOption>
  | ReturnType<typeof makeWalletSelectorValueOption>;

export const getWalletSelectorOptions$ = (
  addError: (error: Error) => void,
  client: Client,
  userAccounts$: Client['userAccounts$'],
  block$: Client['block$'],
  tokens: readonly Token[],
) =>
  concat(
    userAccounts$.pipe(
      take(1),
      map((userAccounts) => userAccounts.map((userAccount) => makeWalletSelectorValueOption({ userAccount }))),
    ),
    combineLatest(userAccounts$.pipe(distinctUntilChanged()), block$).pipe(
      switchMap(async ([userAccounts]) =>
        Promise.all(
          userAccounts.map(async (userAccount) => {
            const account = await client.getAccount(userAccount.id);

            return makeOption({
              client,
              tokens,
              userAccount,
              account,
            });
          }),
        ),
      ),
      multicast(() => new ReplaySubject<readonly WalletSelectorOptionType[]>(1)),
      refCount(),
      catchError((error: Error) => {
        addError(error);

        return of([]);
      }),
    ),
  );

const AddressGrid = styled(Box)`
  display: grid;
  padding: 8px 0;
  grid-template-columns: '80px 1fr';
  grid-template-rows: auto;
  gap: 0;
`;

const createFormatOptionLabel = (isMulti?: boolean) => (
  option: WalletSelectorOptionType,
  { context }: FormatOptionLabelMeta<WalletSelectorOptionType>,
): React.ReactNode => {
  if (context === 'value') {
    return isMulti && option.label === option.address ? option.address.slice(0, 4) : option.label;
  }

  return (
    <AddressGrid>
      <Box>Name:</Box>
      <Box>{option.label}</Box>
      {option.label === option.address ? (
        <></>
      ) : (
        <>
          <Box>Address:</Box>
          <Box>{option.address}</Box>
        </>
      )}
      {((option as any).balances === undefined ? [] : (option as any).balances).map(
        ([name, value]: [string, BigNumber]) => (
          // @ts-ignore
          <React.Fragment key={name}>
            <Box>{name}:</Box>
            <Box>{value.toFormat()}</Box>
          </React.Fragment>
        ),
      )}
    </AddressGrid>
  );
};

const formatOptionLabelMulti = createFormatOptionLabel(true);
const formatOptionLabel = createFormatOptionLabel(false);

const StyledSelect = styled(Select)`
  min-width: 96px;
  max-width: 424px;
`;

export function WalletSelectorBase(props: any) {
  return (
    <StyledSelect
      menuPlacement="bottom"
      {...props}
      formatOptionLabel={props.isMulti ? formatOptionLabelMulti : formatOptionLabel}
    />
  );
}
