// tslint:disable no-unsafe-any
import {
  common,
  crypto,
  Event,
  InvokeReceipt,
  privateKeyToAddress,
  TransactionResult,
  UserAccountID,
} from '@neo-one/client-common';
import { SmartContractAny } from '@neo-one/client-core';
import { withContracts } from '@neo-one/smart-contract-test';
import BigNumber from 'bignumber.js';

export interface DeployOptions {
  readonly masterPrivateKey: string;
  readonly masterAccountID: UserAccountID;
  readonly smartContract: SmartContractAny;
}

export interface Options {
  readonly name: string;
  readonly smartContractName: string;
  readonly filePath: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly deploy?: (options: DeployOptions) => Promise<TransactionResult<InvokeReceipt>>;
  readonly issueValue: BigNumber;
  readonly transferValue: BigNumber;
  readonly description: string;
  readonly payable: boolean;
}

const TO = {
  PRIVATE_KEY: '536f1e9f0466f6cd5b2ea5374d00f038786daa0f0e892161d6b0cb4d6b154740',
  PUBLIC_KEY: '03463b7a0afc41ff1f6a386190f99bafd1deca48f4026aeac95435731af278cb7d',
};

const ZERO = {
  PRIVATE_KEY: '9c111f04a34b3a07600fe701d308dce6e20c86268c105f21c2f30e9fef7e7968',
  PUBLIC_KEY: '027f73dbc47133b08a4bc0fc04589fc76525baaf3bebe71bdd78053d559c41db70',
};

export const testToken = async ({
  name,
  filePath,
  symbol,
  decimals,
  smartContractName,
  deploy,
  issueValue,
  transferValue,
  description,
  payable,
}: Options) => {
  crypto.addPublicKey(common.stringToPrivateKey(TO.PRIVATE_KEY), common.stringToECPoint(TO.PUBLIC_KEY));
  crypto.addPublicKey(common.stringToPrivateKey(ZERO.PRIVATE_KEY), common.stringToECPoint(ZERO.PUBLIC_KEY));

  await withContracts(
    [
      {
        name,
        filePath,
      },
    ],
    async (options) => {
      const { client, networkName, masterAccountID, masterPrivateKey } = options;
      // tslint:disable-next-line no-any
      const smartContract: SmartContractAny = (options as any)[smartContractName];
      let event: Event;
      if (deploy !== undefined) {
        const deployResult = await deploy({
          masterPrivateKey,
          masterAccountID,
          smartContract,
        });

        const deployReceipt = await deployResult.confirmed({ timeoutMS: 2500 });

        if (deployReceipt.result.state !== 'HALT') {
          throw new Error(deployReceipt.result.message);
        }

        expect(deployReceipt.result.gasConsumed.toString()).toMatchSnapshot('deploy consumed');
        expect(deployReceipt.result.gasCost.toString()).toMatchSnapshot('deploy cost');
        expect(deployReceipt.result.value).toBeTruthy();
        expect(deployReceipt.events).toHaveLength(1);
        event = deployReceipt.events[0];
        expect(event.name).toEqual('transfer');
        expect(event.parameters.from).toEqual(undefined);
        expect(event.parameters.to).toEqual(privateKeyToAddress(masterPrivateKey));
        if (event.parameters.amount === undefined) {
          expect(event.parameters.amount).toBeTruthy();
          throw new Error('For TS');
        }
        expect(event.parameters.amount.toString()).toEqual(issueValue.toString());
      }

      const [nameResult, decimalsResult, symbolResult, wallet0] = await Promise.all([
        smartContract.name(),
        smartContract.decimals(),
        smartContract.symbol(),
        client.providers.memory.keystore.addAccount({
          network: networkName,
          name: 'wallet0',
          privateKey: TO.PRIVATE_KEY,
        }),
      ]);
      expect(nameResult).toEqual(name);
      expect(decimalsResult.toString()).toEqual(`${decimals}`);
      expect(symbolResult).toEqual(symbol);

      const account0 = wallet0.account.id;

      const [issueBalance, issueTotalSupply, transferResult] = await Promise.all([
        smartContract.balanceOf(masterAccountID.address),
        smartContract.totalSupply(),
        smartContract.transfer(masterAccountID.address, account0.address, transferValue, { from: masterAccountID }),
      ]);
      expect(issueBalance.toString()).toEqual(issueValue.toString());
      expect(issueTotalSupply.toString()).toEqual(issueValue.toString());

      const transferReceipt = await transferResult.confirmed({ timeoutMS: 2500 });

      if (transferReceipt.result.state !== 'HALT') {
        throw new Error(transferReceipt.result.message);
      }

      expect(transferReceipt.result.gasConsumed.toString()).toMatchSnapshot('transfer consume');
      expect(transferReceipt.result.gasCost.toString()).toMatchSnapshot('transfer cost');
      expect(transferReceipt.events).toHaveLength(1);
      event = transferReceipt.events[0];
      expect(event.name).toEqual('transfer');
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.to).toEqual(account0.address);
      if (event.parameters.amount === undefined) {
        expect(event.parameters.amount).toBeTruthy();
        throw new Error('For TS');
      }
      expect(event.parameters.amount.toString()).toEqual(transferValue.toString());

      const [
        transferMasterBalance,
        transferAccountBalance,
        transferTotalSupply,
        transferZeroBalance,
      ] = await Promise.all([
        smartContract.balanceOf(masterAccountID.address),
        smartContract.balanceOf(account0.address),
        smartContract.totalSupply(),
        smartContract.balanceOf(privateKeyToAddress(ZERO.PRIVATE_KEY)),
      ]);

      const remainingValue = issueValue.minus(transferValue);
      expect(transferMasterBalance.toString()).toEqual(remainingValue.toString());
      expect(transferAccountBalance.toString()).toEqual(transferValue.toString());
      expect(transferTotalSupply.toString()).toEqual(issueValue.toString());
      expect(transferZeroBalance.toString()).toEqual('0');

      const readClient = client.read(networkName);
      const contract = await readClient.getContract(smartContract.definition.networks[networkName].address);
      expect(contract.codeVersion).toEqual('1.0');
      expect(contract.author).toEqual('dicarlo2');
      expect(contract.email).toEqual('alex.dicarlo@neotracker.io');
      expect(contract.description).toEqual(description);
      expect(contract.parameters).toEqual(['String', 'Array']);
      expect(contract.returnType).toEqual('Buffer');
      expect(contract.storage).toBeTruthy();
      expect(contract.dynamicInvoke).toBeTruthy();
      expect(contract.payable).toEqual(payable);
    },
    { deploy: deploy === undefined },
  );
};
