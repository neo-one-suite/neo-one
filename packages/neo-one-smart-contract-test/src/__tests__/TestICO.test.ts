import { common, crypto, privateKeyToAddress } from '@neo-one/client-common';
import { Hash160, SmartContractAny } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import * as path from 'path';
import { withContracts } from '../withContracts';

const MINTER = {
  PRIVATE_KEY: '536f1e9f0466f6cd5b2ea5374d00f038786daa0f0e892161d6b0cb4d6b154740',
  PUBLIC_KEY: '03463b7a0afc41ff1f6a386190f99bafd1deca48f4026aeac95435731af278cb7d',
};

describe('TestICO', () => {
  test('smart contract', async () => {
    await withContracts<{ testIco: SmartContractAny }>(
      [
        {
          filePath: path.resolve(__dirname, '..', '__data__', 'contracts', 'TestICO.ts'),
          name: 'TestICO',
        },
      ],
      async ({ client, networkName, testIco: smartContract, masterAccountID }) => {
        crypto.addPublicKey(common.stringToPrivateKey(MINTER.PRIVATE_KEY), common.stringToECPoint(MINTER.PUBLIC_KEY));
        const deployResult = await smartContract.deploy(
          masterAccountID.address,
          new BigNumber(Math.round(Date.now() / 1000)),
        );
        const deployReceipt = await deployResult.confirmed({ timeoutMS: 2500 });
        if (deployReceipt.result.state !== 'HALT') {
          throw new Error(deployReceipt.result.message);
        }

        expect(deployReceipt.result.gasConsumed.toString()).toMatchSnapshot('deploy consumed');
        expect(deployReceipt.result.value).toBeTruthy();

        const [nameResult, decimalsResult, symbolResult, minter] = await Promise.all([
          smartContract.name(),
          smartContract.decimals(),
          smartContract.symbol(),
          client.providers.memory.keystore.addUserAccount({
            network: networkName,
            name: 'minter',
            privateKey: MINTER.PRIVATE_KEY,
          }),
        ]);
        expect(nameResult).toEqual('TestToken');
        expect(decimalsResult.toString()).toEqual('8');
        expect(symbolResult).toEqual('TT');

        const [initialTotalSupply, transferResult] = await Promise.all([
          smartContract.totalSupply(),
          client.transfer(
            [
              {
                amount: new BigNumber(10000),
                asset: Hash160.NEO,
                to: privateKeyToAddress(MINTER.PRIVATE_KEY),
              },
              {
                amount: new BigNumber(164460781), // TODO: why is the GAS required so large? Because of https://github.com/neo-one-suite/neo-one/issues/2448
                asset: Hash160.GAS,
                to: privateKeyToAddress(MINTER.PRIVATE_KEY),
              },
            ],
            {
              from: masterAccountID,
            },
          ),
        ]);
        expect(initialTotalSupply.toString()).toEqual('0');

        await transferResult.confirmed({ timeoutMS: 2500 });

        const firstMint = new BigNumber('10');
        const mintResult = await smartContract.mintTokens({
          from: minter.userAccount.id,
          sendTo: [
            {
              amount: firstMint,
              asset: common.nativeScriptHashes.NEO,
            },
          ],
        });

        const mintReceipt = await mintResult.confirmed({ timeoutMS: 2500 });
        expect(mintReceipt.result.gasConsumed.toString()).toMatchSnapshot('mint consumed');
        expect(mintReceipt.result.value).toBeUndefined();
        expect(mintReceipt.events).toHaveLength(3);
        const event = mintReceipt.events[2];
        expect(event.name).toEqual('Transfer');
        expect(event.parameters.from).toBeUndefined();
        expect(event.parameters.to).toEqual(minter.userAccount.id.address);
        if (event.parameters.amount === undefined) {
          expect(event.parameters.amount).toBeTruthy();
          throw new Error('For TS');
        }
        const firstBalance = firstMint.times(10).toString();
        expect(event.parameters.amount.toString()).toEqual(firstBalance);

        const [minterBalance, mintTotalSupply] = await Promise.all([
          smartContract.balanceOf(minter.userAccount.id.address),
          smartContract.totalSupply(),
        ]);

        expect(minterBalance.toString(10)).toEqual(firstBalance);
        expect(mintTotalSupply.toString(10)).toEqual(firstBalance);
      },
      { deploy: false },
    );
  });
});
