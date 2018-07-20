// tslint:disable no-unsafe-any
import {
  addressToScriptHash,
  createPrivateKey,
  InvokeReceipt,
  privateKeyToScriptHash,
  SmartContract,
  TransactionResult,
  UserAccountID,
} from '@neo-one/client';
import { setupContractTest } from '@neo-one/smart-contract-compiler';
import BigNumber from 'bignumber.js';

import * as path from 'path';

export interface DeployOptions {
  readonly masterPrivateKey: string;
  readonly masterAccountID: UserAccountID;
  readonly smartContract: SmartContract;
}

export interface Options {
  readonly contractName: string;
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly deploy: (options: DeployOptions) => Promise<TransactionResult<InvokeReceipt>>;
  readonly issueValue: BigNumber;
  readonly transferValue: BigNumber;
  readonly dir: string;
}

export const testToken = ({ contractName, name, symbol, decimals, deploy, issueValue, transferValue }: Options) => {
  const setup = async () =>
    setupContractTest({
      dir: path.resolve(__dirname, 'contracts'),
      contractName,
    });

  describe(contractName, () => {
    test('properties + issue + balanceOf + totalSupply + transfer', async () => {
      const {
        networkName,
        keystore,
        developerClient,
        smartContract,
        masterAccountID,
        masterPrivateKey,
      } = await setup();

      const [nameResult, decimalsResult, symbolResult] = await Promise.all([
        smartContract.name(),
        smartContract.decimals(),
        smartContract.symbol(),
      ]);
      expect(nameResult).toEqual(name);
      expect(decimalsResult.toString()).toEqual(`${decimals}`);
      expect(symbolResult).toEqual(symbol);

      const wallet0 = await keystore.addAccount({
        network: networkName,
        name: 'wallet0',
        privateKey: createPrivateKey(),
      });
      const account0 = wallet0.account.id;

      let result = await deploy({
        masterPrivateKey,
        masterAccountID,
        smartContract,
      });
      let [receipt] = await Promise.all([result.confirmed({ timeoutMS: 30000 }), developerClient.runConsensusNow()]);

      if (receipt.result.state !== 'HALT') {
        throw new Error(receipt.result.message);
      }

      expect(receipt.result.gasConsumed.toString()).toMatchSnapshot('deploy consumed');
      expect(receipt.result.gasCost.toString()).toMatchSnapshot('deploy cost');
      expect(receipt.result.value).toBeTruthy();
      expect(receipt.events).toHaveLength(1);
      let event = receipt.events[0];
      expect(event.name).toEqual('transfer');
      expect(event.parameters.from).toEqual(undefined);
      expect(event.parameters.to).toEqual(privateKeyToScriptHash(masterPrivateKey));
      if (event.parameters.amount === undefined) {
        expect(event.parameters.amount).toBeTruthy();
        throw new Error('For TS');
      }
      expect(event.parameters.amount.toString()).toEqual(issueValue.toString());

      let value = await smartContract.balanceOf(addressToScriptHash(masterAccountID.address));
      expect(value.toString()).toEqual(issueValue.toString());

      value = await smartContract.totalSupply();
      expect(value.toString()).toEqual(issueValue.toString());

      result = await smartContract.transfer(
        addressToScriptHash(masterAccountID.address),
        addressToScriptHash(account0.address),
        transferValue,
        { from: masterAccountID },
      );
      [receipt] = await Promise.all([result.confirmed(), developerClient.runConsensusNow()]);

      if (receipt.result.state !== 'HALT') {
        throw new Error(receipt.result.message);
      }

      expect(receipt.result.gasConsumed.toString()).toMatchSnapshot('transfer consume');
      expect(receipt.result.gasCost.toString()).toMatchSnapshot('transfer cost');
      expect(receipt.events).toHaveLength(1);
      event = receipt.events[0];
      expect(event.name).toEqual('transfer');
      expect(event.parameters.from).toEqual(privateKeyToScriptHash(masterPrivateKey));
      expect(event.parameters.to).toEqual(addressToScriptHash(account0.address));
      if (event.parameters.amount === undefined) {
        expect(event.parameters.amount).toBeTruthy();
        throw new Error('For TS');
      }
      expect(event.parameters.amount.toString()).toEqual(transferValue.toString());

      const remainingValue = issueValue.minus(transferValue);
      value = await smartContract.balanceOf(addressToScriptHash(masterAccountID.address));
      expect(value.toString()).toEqual(remainingValue.toString());

      value = await smartContract.balanceOf(addressToScriptHash(account0.address));
      expect(value.toString()).toEqual(transferValue.toString());

      value = await smartContract.totalSupply();
      expect(value.toString()).toEqual(issueValue.toString());

      value = await smartContract.balanceOf(privateKeyToScriptHash(createPrivateKey()));
      expect(value.toString()).toEqual('0');
    });
  });
};
