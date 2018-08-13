// tslint:disable no-unsafe-any
import {
  addressToScriptHash,
  InvokeReceipt,
  privateKeyToScriptHash,
  SmartContractAny,
  TransactionResult,
  UserAccountID,
  Event,
} from '@neo-one/client';
import { SetupTestResult } from '@neo-one/smart-contract-compiler';
import { crypto, common } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';

export interface DeployOptions {
  readonly masterPrivateKey: string;
  readonly masterAccountID: UserAccountID;
  readonly smartContract: SmartContractAny;
}

export interface Options {
  readonly result: SetupTestResult;
  readonly name: string;
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
  result,
  name,
  symbol,
  decimals,
  deploy,
  issueValue,
  transferValue,
  description,
  payable,
}: Options) => {
  crypto.addPublicKey(common.stringToPrivateKey(TO.PRIVATE_KEY), common.stringToECPoint(TO.PUBLIC_KEY));
  crypto.addPublicKey(common.stringToPrivateKey(ZERO.PRIVATE_KEY), common.stringToECPoint(ZERO.PUBLIC_KEY));

  const { client, networkName, developerClient, smartContract, masterAccountID, masterPrivateKey } = result;

  const [nameResult, decimalsResult, symbolResult, wallet0, deployResult] = await Promise.all([
    smartContract.name(),
    smartContract.decimals(),
    smartContract.symbol(),
    client.providers.memory.keystore.addAccount({
      network: networkName,
      name: 'wallet0',
      privateKey: TO.PRIVATE_KEY,
    }),
    deploy === undefined
      ? Promise.resolve(undefined)
      : deploy({
          masterPrivateKey,
          masterAccountID,
          smartContract,
        }),
  ]);
  expect(nameResult).toEqual(name);
  expect(decimalsResult.toString()).toEqual(`${decimals}`);
  expect(symbolResult).toEqual(symbol);

  const account0 = wallet0.account.id;

  let event: Event;
  if (deployResult !== undefined) {
    const [deployReceipt] = await Promise.all([
      deployResult.confirmed({ timeoutMS: 2500 }),
      developerClient.runConsensusNow(),
    ]);

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
    expect(event.parameters.to).toEqual(privateKeyToScriptHash(masterPrivateKey));
    if (event.parameters.amount === undefined) {
      expect(event.parameters.amount).toBeTruthy();
      throw new Error('For TS');
    }
    expect(event.parameters.amount.toString()).toEqual(issueValue.toString());
  }

  const [issueBalance, issueTotalSupply, transferResult] = await Promise.all([
    smartContract.balanceOf(addressToScriptHash(masterAccountID.address)),
    smartContract.totalSupply(),
    smartContract.transfer(
      addressToScriptHash(masterAccountID.address),
      addressToScriptHash(account0.address),
      transferValue,
      { from: masterAccountID },
    ),
  ]);
  expect(issueBalance.toString()).toEqual(issueValue.toString());
  expect(issueTotalSupply.toString()).toEqual(issueValue.toString());

  const [transferReceipt] = await Promise.all([
    transferResult.confirmed({ timeoutMS: 2500 }),
    developerClient.runConsensusNow(),
  ]);

  if (transferReceipt.result.state !== 'HALT') {
    throw new Error(transferReceipt.result.message);
  }

  expect(transferReceipt.result.gasConsumed.toString()).toMatchSnapshot('transfer consume');
  expect(transferReceipt.result.gasCost.toString()).toMatchSnapshot('transfer cost');
  expect(transferReceipt.events).toHaveLength(1);
  event = transferReceipt.events[0];
  expect(event.name).toEqual('transfer');
  expect(event.parameters.from).toEqual(privateKeyToScriptHash(masterPrivateKey));
  expect(event.parameters.to).toEqual(addressToScriptHash(account0.address));
  if (event.parameters.amount === undefined) {
    expect(event.parameters.amount).toBeTruthy();
    throw new Error('For TS');
  }
  expect(event.parameters.amount.toString()).toEqual(transferValue.toString());

  const [transferMasterBalance, transferAccountBalance, transferTotalSupply, transferZeroBalance] = await Promise.all([
    smartContract.balanceOf(addressToScriptHash(masterAccountID.address)),
    smartContract.balanceOf(addressToScriptHash(account0.address)),
    smartContract.totalSupply(),
    smartContract.balanceOf(privateKeyToScriptHash(ZERO.PRIVATE_KEY)),
  ]);

  const remainingValue = issueValue.minus(transferValue);
  expect(transferMasterBalance.toString()).toEqual(remainingValue.toString());
  expect(transferAccountBalance.toString()).toEqual(transferValue.toString());
  expect(transferTotalSupply.toString()).toEqual(issueValue.toString());
  expect(transferZeroBalance.toString()).toEqual('0');

  const readClient = await client.read(networkName);
  const contract = await readClient.getContract(smartContract.definition.networks[networkName].hash);
  expect(contract.codeVersion).toEqual('1.0');
  expect(contract.author).toEqual('dicarlo2');
  expect(contract.email).toEqual('alex.dicarlo@neotracker.io');
  expect(contract.description).toEqual(description);
  expect(contract.parameters).toEqual(['String', 'Array']);
  expect(contract.returnType).toEqual('ByteArray');
  expect(contract.properties.storage).toBeTruthy();
  expect(contract.properties.dynamicInvoke).toBeFalsy();
  expect(contract.properties.payable).toEqual(payable);
};
