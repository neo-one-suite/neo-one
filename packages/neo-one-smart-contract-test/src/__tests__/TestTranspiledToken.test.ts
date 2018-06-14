// tslint:disable no-unsafe-any
import { abi, addressToScriptHash, createPrivateKey, privateKeyToScriptHash } from '@neo-one/client';
import BigNumber from 'bignumber.js';

import appRootDir from 'app-root-dir';
import path from 'path';

import { cleanupTest } from '../cleanupTest';
import { setupBasicTest } from '../setupBasicTest';

const setup = async () => {
  const nep5 = abi.NEP5_STATIC(4);

  return setupBasicTest({
    contractPath: path.resolve(
      appRootDir.get(),
      'packages',
      'neo-one-smart-contract-test',
      'src',
      '__data__',
      'contracts',
      'TestTranspiledToken.ts',
    ),
    abi: {
      functions: nep5.functions.concat([
        {
          name: 'owner',
          constant: true,
          returnType: { type: 'Hash160' },
        },
        {
          name: 'deploy',
          parameters: [
            {
              name: 'owner',
              type: 'Hash160',
            },
          ],
          returnType: { type: 'Boolean' },
        },
      ]),
      events: nep5.events,
    },
  });
};

describe('TestTranspiledToken', () => {
  afterEach(async () => {
    await cleanupTest();
  });

  test('properties + issue + balanceOf + totalSupply + transfer', async () => {
    const { networkName, keystore, developerClient, smartContract, masterAccountID, masterPrivateKey } = await setup();

    const [nameResult, decimalsResult, symbolResult] = await Promise.all([
      smartContract.name(),
      smartContract.decimals(),
      smartContract.symbol(),
    ]);
    expect(nameResult).toEqual('TestToken');
    expect(decimalsResult.toString()).toEqual('4');
    expect(symbolResult).toEqual('TT');

    const wallet0 = await keystore.addAccount({
      network: networkName,
      name: 'wallet0',
      privateKey: createPrivateKey(),
    });
    const account0 = wallet0.account.id;

    const owner = privateKeyToScriptHash(masterPrivateKey);
    let result = await smartContract.deploy(owner, { from: masterAccountID });
    let [receipt] = await Promise.all([result.confirmed({ timeoutMS: 30000 }), developerClient.runConsensusNow()]);

    expect(receipt.result.state).toEqual('HALT');
    expect(receipt.result.gasConsumed.toString()).toMatchSnapshot('deploy consumed');
    expect(receipt.result.gasCost.toString()).toMatchSnapshot('deploy cost');
    expect(receipt.result.value).toBeTruthy();

    let value = await smartContract.owner();
    expect(value).toEqual(owner);

    const issueValue = new BigNumber('100');
    value = await smartContract.balanceOf(addressToScriptHash(masterAccountID.address));
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
    [receipt] = await Promise.all([result.confirmed(), developerClient.runConsensusNow()]);

    expect(receipt.result.state).toEqual('HALT');
    expect(receipt.result.gasConsumed.toString()).toMatchSnapshot('transfer consume');
    expect(receipt.result.gasCost.toString()).toMatchSnapshot('transfer cost');

    value = await smartContract.balanceOf(addressToScriptHash(masterAccountID.address));
    expect(value.toString()).toEqual(transferValue.toString());

    value = await smartContract.balanceOf(addressToScriptHash(account0.address));
    expect(value.toString()).toEqual(transferValue.toString());

    value = await smartContract.totalSupply();
    expect(value.toString()).toEqual(issueValue.toString());
  });
});
