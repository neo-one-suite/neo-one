import { common, crypto } from '@neo-one/client-common';
import { SmartContractAny } from '@neo-one/client-core';
import { withContracts } from '@neo-one/smart-contract-test';
import * as path from 'path';

const RECIPIENT = {
  PRIVATE_KEY: '7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344',
  PUBLIC_KEY: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
};

describe('TestDesignatedCaller', () => {
  test('deploy + transfer', async () => {
    await withContracts<{ testDesignatedCaller: SmartContractAny }>(
      [
        {
          filePath: path.resolve(__dirname, '..', '__data__', 'contracts', 'TestDesignatedCaller.ts'),
          name: 'TestDesignatedCaller',
        },
      ],
      async ({ client, networkName, testDesignatedCaller: smartContract, masterAccountID }) => {
        crypto.addPublicKey(
          common.stringToPrivateKey(RECIPIENT.PRIVATE_KEY),
          common.stringToECPoint(RECIPIENT.PUBLIC_KEY),
        );

        const deployResult = await smartContract.deploy(masterAccountID.address, { from: masterAccountID });

        const deployReceipt = await deployResult.confirmed({ timeoutMS: 2500 });
        if (deployReceipt.result.state !== 'HALT') {
          throw new Error(deployReceipt.result.message);
        }

        expect(deployReceipt.result.gasConsumed.toString()).toMatchSnapshot('deploy consumed');
        expect(deployReceipt.result.gasCost.toString()).toMatchSnapshot('deploy cost');
        expect(deployReceipt.result.value).toBeTruthy();

        const [designatedCaller, recipient] = await Promise.all([
          smartContract.designatedCaller(),

          client.providers.memory.keystore.addUserAccount({
            network: networkName,
            name: 'recipient',
            privateKey: RECIPIENT.PRIVATE_KEY,
          }),
        ]);

        expect(designatedCaller.toString()).toEqual(masterAccountID.address);
        expect(designatedCaller.toString()).not.toEqual(recipient.userAccount.id.address);

        const transferResult = await smartContract.designateCaller(recipient.userAccount.id.address, {
          from: masterAccountID,
        });
        const transferReciept = await transferResult.confirmed({ timeoutMS: 2500 });
        const newCaller = await smartContract.designatedCaller();
        if (transferReciept.result.state !== 'HALT') {
          throw new Error(transferReciept.result.message);
        }

        expect(newCaller.toString()).toEqual(recipient.userAccount.id.address);

        const bogusTransferResult = await smartContract.designateCaller(masterAccountID.address, {
          from: masterAccountID,
        });
        const bogusTransferReciept = await bogusTransferResult.confirmed({ timeoutMS: 2500 });
        if (bogusTransferReciept.result.state !== 'HALT') {
          throw new Error(bogusTransferReciept.result.message);
        }
        const noopCaller = await smartContract.designatedCaller();
        expect(noopCaller.toString()).toEqual(recipient.userAccount.id.address);

        expect(bogusTransferReciept.result.value).toBeFalsy();
      },
      { deploy: false },
    );
  });
});
