// tslint:disable no-any
import { Account, Client, Hash256, nep5, UserAccount } from '@neo-one/client';
import BigNumber from 'bignumber.js';
import * as React from 'react';
import Select from 'react-select';
// tslint:disable-next-line no-submodule-imports
import { FormatOptionLabelMeta } from 'react-select/lib/Select';
import { Grid, styled } from 'reakit';
import { combineLatest, of, ReplaySubject } from 'rxjs';
import { catchError, distinctUntilChanged, multicast, refCount, switchMap } from 'rxjs/operators';
import { ComponentProps } from '../types';
import { Token } from './DeveloperToolsContext';
import { Selector } from './Selector';

export const makeOption = async ({
  client,
  userAccount,
  account,
  tokens,
}: {
  readonly client: Client;
  readonly userAccount: UserAccount;
  readonly account: Account;
  readonly tokens: ReadonlyArray<Token>;
}) => {
  const [assetBalances, tokenBalances] = await Promise.all([
    Promise.all(
      Object.entries(account.balances).map<Promise<[string, BigNumber]>>(async ([assetHash, value]) => {
        if (assetHash === Hash256.NEO) {
          return ['NEO', value];
        }

        if (assetHash === Hash256.GAS) {
          return ['GAS', value];
        }

        const asset = await client.read(userAccount.id.network).getAsset(assetHash);

        return [asset.name, value];
      }),
    ),
    Promise.all(
      tokens
        .filter((token) => token.network === userAccount.id.network)
        .map<Promise<[string, BigNumber]>>(async (token) => {
          const readSmartContract = nep5
            .createNEP5SmartContract(client, { [token.network]: { address: token.address } }, token.decimals)
            .read(token.network);

          const balance = await readSmartContract.balanceOf(userAccount.id.address);

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
    balances: assetBalances.concat(tokenBalances).sort(([nameA], [nameB]) => {
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

export const makeValueOption = ({ userAccount }: { readonly userAccount: UserAccount }) => ({
  value: `${userAccount.id.network}:${userAccount.id.address}`,
  label: userAccount.name,
  address: userAccount.id.address,
  id: userAccount.id,
  userAccount,
});

export type OptionType = PromiseReturnType<typeof makeOption> | ReturnType<typeof makeValueOption>;

export const getOptions$ = (addError: (error: Error) => void, client: Client, tokens: ReadonlyArray<Token>) =>
  combineLatest(client.accounts$.pipe(distinctUntilChanged()), client.block$).pipe(
    switchMap(async ([userAccounts]) =>
      Promise.all(
        userAccounts.map(async (userAccount) => {
          const account = await client.read(userAccount.id.network).getAccount(userAccount.id.address);

          return makeOption({
            client,
            tokens,
            userAccount,
            account,
          });
        }),
      ),
    ),
    multicast(() => new ReplaySubject(1)),
    refCount(),
    catchError((error: Error) => {
      addError(error);

      return of([]);
    }),
  );

const AddressGrid = styled(Grid)`
  padding: 8px 0;
`;

const createFormatOptionLabel = (isMulti?: boolean) => (
  option: OptionType,
  { context }: FormatOptionLabelMeta<OptionType>,
): React.ReactNode => {
  if (context === 'value') {
    return isMulti && option.label === option.address ? option.address.slice(0, 4) : option.label;
  }

  return (
    <AddressGrid columns="80px 1fr" autoRows="auto" gap="0">
      <Grid.Item>Name:</Grid.Item>
      <Grid.Item>{option.label}</Grid.Item>
      {option.label === option.address ? (
        <></>
      ) : (
        <>
          <Grid.Item>Address:</Grid.Item>
          <Grid.Item>{option.address}</Grid.Item>
        </>
      )}
      {((option as any).balances === undefined ? [] : (option as any).balances).map(
        ([name, value]: [string, BigNumber]) => (
          <React.Fragment key={name}>
            <Grid.Item>{name}:</Grid.Item>
            <Grid.Item>{value.toFormat()}</Grid.Item>
          </React.Fragment>
        ),
      )}
    </AddressGrid>
  );
};

const formatOptionLabelMulti = createFormatOptionLabel(true);
const formatOptionLabel = createFormatOptionLabel(false);

const StyledSelector = styled(Selector)`
  width: 424px;
` as React.ComponentType<ComponentProps<Select<OptionType>>>;

export function WalletSelectorBase(props: ComponentProps<Select<OptionType>>) {
  return (
    <StyledSelector
      menuPlacement="bottom"
      {...props}
      formatOptionLabel={props.isMulti ? formatOptionLabelMulti : formatOptionLabel}
    />
  );
}
