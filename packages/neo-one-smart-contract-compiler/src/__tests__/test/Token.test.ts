// wallaby.skip
// tslint:disable no-unsafe-any
import { abi, addressToScriptHash, createPrivateKey, privateKeyToScriptHash, assets } from '@neo-one/client';
import BigNumber from 'bignumber.js';
import * as appRootDir from 'app-root-dir';
import { setupBasicTest } from '../../test/setupBasicTest';
import { pathResolve } from '../../utils';

const setup = async () => {
  const nep5 = abi.NEP5_STATIC(8);

  return setupBasicTest({
    contractPath: pathResolve(
      appRootDir.get(),
      'packages',
      'neo-one-smart-contract-compiler',
      'src',
      '__data__',
      'contracts',
      'Token.ts',
    ),
    abi: {
      functions: nep5.functions.concat([
        {
          name: 'owner',
          constant: true,
          returnType: { type: 'Hash160' },
        },
        {
          name: 'issue',
          parameters: [
            {
              name: 'addr',
              type: 'Hash160',
            },
            {
              name: 'amount',
              type: 'Integer',
              decimals: 8,
            },
          ],
          returnType: { type: 'Boolean' },
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

describe('Token', () => {
  test('properties + issue + balanceOf + totalSupply + transfer', async () => {
    const {
      networkName,
      keystore,
      developerClient,
      client,
      smartContract,
      masterAccountID,
      masterPrivateKey,
    } = await setup();

    const [nameResult, decimalsResult, symbolResult] = await Promise.all([
      smartContract.name(),
      smartContract.decimals(),
      smartContract.symbol(),
    ]);
    expect(nameResult).toEqual('TestToken');
    expect(decimalsResult.toString()).toEqual('8');
    expect(symbolResult).toEqual('TT');

    const [wallet0, wallet1] = await Promise.all([
      keystore.addAccount({
        network: networkName,
        name: 'wallet0',
        privateKey: createPrivateKey(),
      }),
      keystore.addAccount({
        network: networkName,
        name: 'wallet1',
        privateKey: createPrivateKey(),
      }),
    ]);
    const account0 = wallet0.account.id;
    const account1 = wallet1.account.id;

    await client.transfer(new BigNumber('100'), assets.GAS_ASSET_HASH, account0.address, { from: masterAccountID });

    const owner = privateKeyToScriptHash(masterPrivateKey);
    let result = await smartContract.deploy(owner, { from: masterAccountID });
    let [receipt] = await Promise.all([result.confirmed(), developerClient.runConsensusNow()]);

    expect(receipt.result.state).toEqual('HALT');
    expect(receipt.result.gasConsumed.toString()).toMatchSnapshot('deploy consumed');
    expect(receipt.result.gasCost.toString()).toMatchSnapshot('deploy cost');
    expect(receipt.result.value).toBeTruthy();

    const ownerValue = await smartContract.owner();
    expect(ownerValue).toEqual(owner);

    const supply = await smartContract.totalSupply();
    expect(supply.toString(10)).toEqual('0');

    const issueValue = new BigNumber('100');
    result = await smartContract.issue(addressToScriptHash(account0.address), issueValue, { from: masterAccountID });
    [receipt] = await Promise.all([result.confirmed(), developerClient.runConsensusNow()]);

    expect(receipt.result.state).toEqual('HALT');
    expect(receipt.result.gasConsumed.toString()).toMatchSnapshot('issue consume');
    expect(receipt.result.gasCost.toString()).toMatchSnapshot('issue cost');
    expect(receipt.result.value).toBeTruthy();

    let value = await smartContract.balanceOf(addressToScriptHash(account0.address));
    expect(value.toString()).toEqual(issueValue.toString());

    value = await smartContract.totalSupply();
    expect(value.toString()).toEqual(issueValue.toString());

    const transferValue = issueValue.div(2);
    result = await smartContract.transfer(
      addressToScriptHash(account0.address),
      addressToScriptHash(account1.address),
      transferValue,
      { from: account0 },
    );
    [receipt] = await Promise.all([result.confirmed(), developerClient.runConsensusNow()]);

    expect(receipt.result.state).toEqual('HALT');
    expect(receipt.result.gasConsumed.toString()).toMatchSnapshot('transfer consume');
    expect(receipt.result.gasCost.toString()).toMatchSnapshot('transfer cost');
    expect(receipt.result.value).toBeTruthy();

    value = await smartContract.balanceOf(addressToScriptHash(account0.address));
    expect(value.toString()).toEqual(transferValue.toString());

    value = await smartContract.balanceOf(addressToScriptHash(account1.address));
    expect(value.toString()).toEqual(transferValue.toString());

    value = await smartContract.totalSupply();
    expect(value.toString()).toEqual(issueValue.toString());
  });
});
