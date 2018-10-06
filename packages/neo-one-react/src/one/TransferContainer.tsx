// tslint:disable no-null-keyword
import { Client, DeveloperClient, Hash256, nep5, TransactionResult, UserAccount } from '@neo-one/client';
import BigNumber from 'bignumber.js';
import { ActionMap, ComposableContainer, EffectMap } from 'constate';
import _ from 'lodash';
import * as React from 'react';
import { Container } from 'reakit';
import { ReactSyntheticEvent } from '../types';
import { Token, WithNetworkClient } from './DeveloperToolsContext';
import { WithAddError } from './WithAddError';

interface State {
  readonly text: string;
  readonly to: ReadonlyArray<UserAccount>;
  readonly asset: Asset;
  readonly amount: BigNumber | undefined;
  readonly loading: boolean;
}

interface Actions {
  readonly onChangeAmount: (event: ReactSyntheticEvent) => void;
  readonly onChangeAsset: (asset: Asset) => void;
  readonly onChangeTo: (to: ReadonlyArray<UserAccount>) => void;
}

interface Effects {
  readonly send: () => void;
}

const actions: ActionMap<State, Actions> = {
  onChangeAmount: (event) => () => {
    const text = event.currentTarget.value;

    let amount: BigNumber | undefined;
    try {
      amount = new BigNumber(text);
      if (amount.toString() !== text) {
        amount = undefined;
      }
    } catch {
      // do nothing
    }

    return { text, amount };
  },
  onChangeAsset: (asset) => () => ({ asset }),
  onChangeTo: (to) => () => ({ to }),
};

export const TOKEN = 'token';

const makeEffects = (
  addError: (error: Error) => void,
  client: Client,
  developerClient: DeveloperClient | undefined,
): EffectMap<State, Effects> => ({
  send: () => ({
    state: { asset, to, amount },
    setState,
  }: {
    state: State;
    setState: (state: Partial<State>) => void;
  }) => {
    const from = client.getCurrentUserAccount();
    if (amount === undefined || to.length === 0 || from === undefined) {
      return;
    }

    setState({ loading: true });

    const onComplete = () => {
      setState({ loading: false });
    };

    const onError = (error: Error) => {
      addError(error);
      onComplete();
    };

    const toConfirm = async (result: TransactionResult) => {
      try {
        await result.confirmed();
        onComplete();
      } catch (error) {
        onError(error);
      }
    };

    // tslint:disable-next-line possible-timing-attack
    if (asset.type === 'token') {
      const smartContract = nep5.createNEP5SmartContract(
        client,
        { [asset.token.network]: { address: asset.token.address } },
        asset.token.decimals,
      );
      Promise.all(to.map((account) => smartContract.transfer(from.id.address, account.id.address, amount)))
        .then(async (results) => {
          await Promise.all([
            Promise.all(results.map(toConfirm)),
            developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
          ]);
        })
        .catch(onError);
    } else {
      client
        .transfer(to.map((account) => ({ asset: asset.value, amount, to: account.id.address })))
        .then(async (result) =>
          Promise.all([
            toConfirm(result),
            developerClient === undefined ? Promise.resolve() : developerClient.runConsensusNow(),
          ]),
        )
        .catch(onError);
    }
  },
});

export interface AssetAsset {
  readonly type: 'asset';
  readonly value: string;
  readonly label: string;
}
export interface TokenAsset {
  readonly type: 'token';
  readonly value: string;
  readonly label: string;
  readonly token: Token;
}
export type Asset = AssetAsset | TokenAsset;

export const getTokenAsset = (token: Token): TokenAsset => ({
  type: 'token',
  token,
  label: token.symbol,
  value: token.address,
});

export const ASSETS: ReadonlyArray<Asset> = [
  {
    type: 'asset',
    value: Hash256.NEO,
    label: 'NEO',
  },
  {
    type: 'asset',
    value: Hash256.GAS,
    label: 'GAS',
  },
];

export const TransferContainer: ComposableContainer<State, Actions, {}, Effects> = (props) => (
  <WithAddError>
    {(addError) => (
      <WithNetworkClient>
        {({ client, developerClient }) => {
          const effects = makeEffects(addError, client, developerClient);

          return (
            <Container
              {...props}
              context="transfer"
              actions={actions}
              effects={effects}
              shouldUpdate={({ state, nextState }) => !_.isEqual(state, nextState)}
            />
          );
        }}
      </WithNetworkClient>
    )}
  </WithAddError>
);
