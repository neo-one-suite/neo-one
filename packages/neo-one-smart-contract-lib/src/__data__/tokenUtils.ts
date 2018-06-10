import BigNumber from 'bignumber.js';
import {
  addressToScriptHash,
  createPrivateKey,
  privateKeyToScriptHash,
  TransactionResult,
  InvokeReceipt,
  UserAccountID,
  SmartContract,
} from '@neo-one/client';
import { cleanupTest, setupContractTest } from '@neo-one/smart-contract-test';

import appRootDir from 'app-root-dir';
import path from 'path';

export interface DeployOptions {
  masterPrivateKey: string;
  masterAccountID: UserAccountID;
  smartContract: SmartContract;
}

export interface Options {
  contractName: string;
  name: string;
  symbol: string;
  decimals: number;
  deploy: (options: DeployOptions) => Promise<TransactionResult<InvokeReceipt>>;
  issueValue: BigNumber;
  transferValue: BigNumber;
  contractHash: string;
  dir: string;
}

export const testToken = ({
  contractName,
  name,
  symbol,
  decimals,
  deploy,
  issueValue,
  transferValue,
  contractHash,
  dir,
}: Options) => {
  const setup = () =>
    setupContractTest({
      dir: path.resolve(
        appRootDir.get(),
        'packages',
        'neo-one-smart-contract-lib',
        'src',
        '__data__',
        'contracts',
      ),
      contractName,
    });

  describe(contractName, () => {
    afterEach(async () => {
      await cleanupTest();
    });

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
      let [receipt] = await Promise.all([
        result.confirmed({ timeoutMS: 30000 }),
        developerClient.runConsensusNow(),
      ]);

      if (receipt.result.state !== 'HALT') {
        expect(receipt.result.state).toEqual('HALT');
        throw new Error('For TS');
      }

      expect(receipt.result.gasConsumed.toString()).toMatchSnapshot(
        'deploy consumed',
      );
      expect(receipt.result.gasCost.toString()).toMatchSnapshot('deploy cost');
      expect(receipt.result.value).toBeTruthy();
      expect(receipt.events).toHaveLength(1);
      let event = receipt.events[0];
      expect(event.name).toEqual('transfer');
      expect(event.parameters.from).toEqual(contractHash);
      expect(event.parameters.to).toEqual(
        privateKeyToScriptHash(masterPrivateKey),
      );
      if (event.parameters.amount == null) {
        expect(event.parameters.amount).toBeTruthy();
        throw new Error('For TS');
      }
      expect(event.parameters.amount.toString()).toEqual(issueValue.toString());

      let value = await smartContract.balanceOf(
        addressToScriptHash(masterAccountID.address),
      );
      expect(value.toString()).toEqual(issueValue.toString());

      value = await smartContract.totalSupply();
      expect(value.toString()).toEqual(issueValue.toString());

      result = await smartContract.transfer(
        addressToScriptHash(masterAccountID.address),
        addressToScriptHash(account0.address),
        transferValue,
        { from: masterAccountID },
      );
      [receipt] = await Promise.all([
        result.confirmed(),
        developerClient.runConsensusNow(),
      ]);

      if (receipt.result.state !== 'HALT') {
        expect(receipt.result.state).toEqual('HALT');
        throw new Error('For TS');
      }

      expect(receipt.result.gasConsumed.toString()).toMatchSnapshot(
        'transfer consume',
      );
      expect(receipt.result.gasCost.toString()).toMatchSnapshot(
        'transfer cost',
      );
      expect(receipt.events).toHaveLength(1);
      event = receipt.events[0];
      expect(event.name).toEqual('transfer');
      expect(event.parameters.from).toEqual(
        privateKeyToScriptHash(masterPrivateKey),
      );
      expect(event.parameters.to).toEqual(
        addressToScriptHash(account0.address),
      );
      if (event.parameters.amount == null) {
        expect(event.parameters.amount).toBeTruthy();
        throw new Error('For TS');
      }
      expect(event.parameters.amount.toString()).toEqual(
        transferValue.toString(),
      );

      const remainingValue = issueValue.minus(transferValue);
      value = await smartContract.balanceOf(
        addressToScriptHash(masterAccountID.address),
      );
      expect(value.toString()).toEqual(remainingValue.toString());

      value = await smartContract.balanceOf(
        addressToScriptHash(account0.address),
      );
      expect(value.toString()).toEqual(transferValue.toString());

      value = await smartContract.totalSupply();
      expect(value.toString()).toEqual(issueValue.toString());

      value = await smartContract.balanceOf(
        privateKeyToScriptHash(createPrivateKey()),
      );
      expect(value.toString()).toEqual('0');
    });
  });
};
