// wallaby.skip
import BigNumber from 'bignumber.js';
import { setupContractTest, SetupTestResult } from '@neo-one/smart-contract-compiler';
import * as path from 'path';
import { privateKeyToScriptHash, assets, scriptHashToAddress, privateKeyToAddress } from '@neo-one/client';
import { common, crypto } from '@neo-one/client-core';

const MINTER = {
  PRIVATE_KEY: '536f1e9f0466f6cd5b2ea5374d00f038786daa0f0e892161d6b0cb4d6b154740',
  PUBLIC_KEY: '03463b7a0afc41ff1f6a386190f99bafd1deca48f4026aeac95435731af278cb7d',
};

const setup = async () =>
  setupContractTest(path.resolve(__dirname, '..', '__data__', 'contracts', 'TestICO.ts'), 'TestICO');

describe('TestICO', () => {
  let result: SetupTestResult;
  beforeEach(async () => {
    result = await setup();
  });

  afterEach(async () => {
    await result.cleanup();
  });

  test('smart contract', async () => {
    crypto.addPublicKey(common.stringToPrivateKey(MINTER.PRIVATE_KEY), common.stringToECPoint(MINTER.PUBLIC_KEY));
    const { client, networkName, developerClient, smartContract, masterAccountID, masterPrivateKey } = result;

    const [nameResult, decimalsResult, symbolResult, minter, deployResult] = await Promise.all([
      smartContract.name(),
      smartContract.decimals(),
      smartContract.symbol(),
      client.providers.memory.keystore.addAccount({
        network: networkName,
        name: 'minter',
        privateKey: MINTER.PRIVATE_KEY,
      }),
      smartContract.deploy(privateKeyToScriptHash(masterPrivateKey), new BigNumber(Math.round(Date.now() / 1000))),
    ]);
    expect(nameResult).toEqual('TestToken');
    expect(decimalsResult.toString()).toEqual('8');
    expect(symbolResult).toEqual('TT');

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

    const [initialTotalSupply, transferResult] = await Promise.all([
      smartContract.totalSupply(),
      client.transfer(
        [
          {
            amount: new BigNumber(10000),
            asset: assets.NEO_ASSET_HASH,
            to: privateKeyToAddress(MINTER.PRIVATE_KEY),
          },
          {
            amount: new BigNumber(10000),
            asset: assets.GAS_ASSET_HASH,
            to: privateKeyToAddress(MINTER.PRIVATE_KEY),
          },
        ],
        {
          from: masterAccountID,
        },
      ),
    ]);
    expect(initialTotalSupply.toString()).toEqual('0');

    await Promise.all([transferResult.confirmed({ timeoutMS: 2500 }), developerClient.runConsensusNow()]);

    const firstMint = new BigNumber('10');
    const mintResult = await smartContract.mintTokens({
      from: minter.account.id,
      transfers: [
        {
          amount: firstMint,
          asset: assets.NEO_ASSET_HASH,
          to: scriptHashToAddress(smartContract.definition.networks[client.providers.memory.getNetworks()[0]].hash),
        },
      ],
    });

    const [mintReceipt] = await Promise.all([
      mintResult.confirmed({ timeoutMS: 2500 }),
      developerClient.runConsensusNow(),
    ]);

    expect(mintReceipt.result.gasConsumed.toString()).toMatchSnapshot('mint consumed');
    expect(mintReceipt.result.gasCost.toString()).toMatchSnapshot('mint cost');
    expect(mintReceipt.result.value).toEqual(true);
    expect(mintReceipt.events).toHaveLength(1);
    const event = mintReceipt.events[0];
    expect(event.name).toEqual('transfer');
    expect(event.parameters.from).toBeUndefined();
    expect(event.parameters.to).toEqual(minter.account.scriptHash);
    if (event.parameters.amount === undefined) {
      expect(event.parameters.amount).toBeTruthy();
      throw new Error('For TS');
    }
    const firstBalance = firstMint.times(10).toString();
    expect(event.parameters.amount.toString()).toEqual(firstBalance);

    const [minterBalance, mintTotalSupply] = await Promise.all([
      smartContract.balanceOf(minter.account.scriptHash),
      smartContract.totalSupply(),
    ]);

    expect(minterBalance.toString(10)).toEqual(firstBalance);
    expect(mintTotalSupply.toString(10)).toEqual(firstBalance);
  });
});
