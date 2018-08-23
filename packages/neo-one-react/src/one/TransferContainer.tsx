// tslint:disable no-null-keyword
import { Client, DeveloperClient, Hash256, nep5, TransactionResult, UserAccount } from '@neo-one/client';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import * as React from 'react';
import { Container } from 'reakit';
import { ReactSyntheticEvent } from '../types';
import { Token, WithNetworkClient } from './DeveloperToolsContext';
import { WithAddError } from './ErrorsContainer';

const actions = {
  onChangeAmount: (event: ReactSyntheticEvent) => {
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
  onChangeAsset: (asset: Asset) => ({ asset }),
  onChangeTo: (to: ReadonlyArray<UserAccount>) => ({ to }),
};

export const TOKEN = 'token';

const makeEffects = (
  addError: (error: Error) => void,
  client: Client,
  developerClient: DeveloperClient | undefined,
) => ({
  send: () => ({
    state: { asset, to, amount },
    setState,
  }: {
    state: State;
    setState: (state: Partial<State>) => void;
  }) => {
    const from = client.getCurrentAccount();
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

type Effects = ReturnType<typeof makeEffects>;

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

interface State {
  readonly text: string;
  readonly to: ReadonlyArray<UserAccount>;
  readonly asset: Asset;
  readonly amount: BigNumber | undefined;
  readonly loading: boolean;
}

interface RenderProps extends State {
  readonly onChangeAmount: (typeof actions)['onChangeAmount'];
  readonly onChangeAsset: (typeof actions)['onChangeAsset'];
  readonly send: Effects['send'];
  readonly onChangeTo: (typeof actions)['onChangeTo'];
}

interface Props {
  readonly children: (props: RenderProps) => React.ReactNode;
}
export const TransferContainer = ({ children }: Props) => (
  <WithAddError>
    {(addError) => (
      <WithNetworkClient>
        {({ client, developerClient }) => {
          const effects = makeEffects(addError, client, developerClient);

          return (
            <Container
              context="transfer"
              actions={actions}
              effects={effects}
              shouldUpdate={({ state, nextState }: { state: State; nextState: State }) => !_.isEqual(state, nextState)}
            >
              {children}
            </Container>
          );
        }}
      </WithNetworkClient>
    )}
  </WithAddError>
);
