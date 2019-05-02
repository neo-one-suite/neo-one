import { TransactionResult, UserAccount } from '@neo-one/client-common';
import { nep5 } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import * as React from 'react';
import { useNetworkClients } from './DeveloperToolsContext';
import { useAddError } from './ToastsContext';
import { TransferAmount } from './TransferAmount';
import { Asset, ASSETS } from './transferCommon';
import { TransferTo } from './TransferTo';

const { useCallback, useState } = React;

export function WalletTransfer() {
  const [text, setText] = useState<string>('');
  const [to, setTo] = useState<readonly UserAccount[]>([]);
  const [asset, setAsset] = useState<Asset>(ASSETS[0]);
  const [amount, setAmount] = useState<BigNumber | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const { client, developerClient } = useNetworkClients();
  const addError = useAddError();

  const onChangeAmount = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextText = event.currentTarget.value;

      let nextAmount: BigNumber | undefined;
      try {
        nextAmount = new BigNumber(nextText);
        if (nextAmount.toString() !== nextText) {
          nextAmount = undefined;
        }
      } catch {
        // do nothing
      }

      setText(nextText);
      setAmount(nextAmount);
    },
    [setText, setAmount],
  );
  const onChangeAsset = setAsset;
  const onChangeTo = setTo;
  const send = useCallback(() => {
    const from = client.getCurrentUserAccount();
    if (amount === undefined || to.length === 0 || from === undefined) {
      return;
    }

    setLoading(true);

    const onComplete = () => {
      setLoading(false);
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
  }, [client, setLoading, addError, asset, amount, to, developerClient]);

  return (
    <>
      <TransferTo to={to} onChangeTo={onChangeTo} />
      <TransferAmount
        text={text}
        asset={asset}
        amount={amount}
        loading={loading}
        to={to}
        onChangeAmount={onChangeAmount}
        onChangeAsset={onChangeAsset}
        send={send}
      />
    </>
  );
}
