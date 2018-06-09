import BigNumber from 'bignumber.js';
import {
  addressToScriptHash,
  createPrivateKey,
  privateKeyToScriptHash,
} from '@neo-one/client';
import { cleanupTest, setupContractTest } from '@neo-one/smart-contract-test';

import appRootDir from 'app-root-dir';
import path from 'path';

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
    contractName: 'TestToken',
  });

describe('Token', () => {
  afterEach(async () => {
    await cleanupTest();
  });

  test('name', async () => {
    const { smartContract } = await setup();

    const result = await smartContract.name();

    expect(result).toEqual('TestToken');
  });

  test('decimals', async () => {
    const { smartContract } = await setup();

    const result = await smartContract.decimals();

    expect(result.toString()).toEqual('4');
  });

  test('symbol', async () => {
    const { smartContract } = await setup();

    const result = await smartContract.symbol();

    expect(result).toEqual('TT');
  });

  test('issue + balanceOf + totalSupply + transfer', async () => {
    const {
      networkName,
      keystore,
      developerClient,
      smartContract,
      masterAccountID,
      masterPrivateKey,
    } = await setup();

    const wallet0 = await keystore.addAccount({
      network: networkName,
      name: 'wallet0',
      privateKey: createPrivateKey(),
    });
    const account0 = wallet0.account.id;

    let result = await smartContract.deploy(
      privateKeyToScriptHash(masterPrivateKey),
      { from: masterAccountID },
    );
    let [receipt] = await Promise.all([
      result.confirmed({ timeoutMS: 30000 }),
      developerClient.runConsensusNow(),
    ]);

    expect(receipt.result.state).toEqual('HALT');
    expect(receipt.result.gasConsumed.toString()).toMatchSnapshot(
      'deploy consumed',
    );
    expect(receipt.result.gasCost.toString()).toMatchSnapshot('deploy cost');
    expect(receipt.result.value).toBeTruthy();
    expect(receipt.events).toHaveLength(1);
    let event = receipt.events[0];
    expect(event.name).toEqual('transfer');
    expect(event.parameters.from).toEqual(
      '0xcda5ae3ce34a488a7e6642b42ec2d853553d4ef8',
    );
    expect(event.parameters.to).toEqual(
      privateKeyToScriptHash(masterPrivateKey),
    );
    expect(event.parameters.amount.toString()).toEqual('100');

    const issueValue = new BigNumber('100');
    let value = await smartContract.balanceOf(
      addressToScriptHash(masterAccountID.address),
    );
    expect(value.toString()).toEqual(issueValue.toString());

    value = await smartContract.totalSupply();
    expect(value.toString()).toEqual(issueValue.toString());

    const transferValue = issueValue.div(2);
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

    expect(receipt.result.state).toEqual('HALT');
    expect(receipt.result.gasConsumed.toString()).toMatchSnapshot(
      'transfer consume',
    );
    expect(receipt.result.gasCost.toString()).toMatchSnapshot('transfer cost');
    expect(receipt.events).toHaveLength(1);
    event = receipt.events[0];
    expect(event.name).toEqual('transfer');
    expect(event.parameters.from).toEqual(
      privateKeyToScriptHash(masterPrivateKey),
    );
    expect(event.parameters.to).toEqual(addressToScriptHash(account0.address));
    expect(event.parameters.amount.toString()).toEqual(
      transferValue.toString(),
    );

    value = await smartContract.balanceOf(
      addressToScriptHash(masterAccountID.address),
    );
    expect(value.toString()).toEqual(transferValue.toString());

    value = await smartContract.balanceOf(
      addressToScriptHash(account0.address),
    );
    expect(value.toString()).toEqual(transferValue.toString());

    value = await smartContract.totalSupply();
    expect(value.toString()).toEqual(issueValue.toString());
  });
});
