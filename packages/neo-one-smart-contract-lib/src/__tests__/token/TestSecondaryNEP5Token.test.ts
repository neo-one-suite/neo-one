import { common, crypto } from '@neo-one/client-common';
import { SmartContractAny } from '@neo-one/client-core';
import { withContracts } from '@neo-one/smart-contract-test';
import * as path from 'path';

const RECIPIENT = {
  PRIVATE_KEY: '7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344',
  PUBLIC_KEY: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
};

describe('Secondary NEP5 Token', () => {
  test('deploy + transfer', async () => {
    await withContracts<{ testSecondaryNep5Token: SmartContractAny }>(
      [
        {
          filePath: path.resolve(__dirname, '..', '..', '__data__', 'contracts', 'token', 'TestSecondaryNEP5Token.ts'),
          name: 'TestSecondaryNEP5Token',
        },
      ],
      async ({ client, networkName, testSecondaryNep5Token: smartContract, masterAccountID }) => {
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

        const [initialPrimary, recipient] = await Promise.all([
          smartContract.primary.confirmed(),
          client.providers.memory.keystore.addUserAccount({
            network: networkName,
            name: 'recipient',
            privateKey: RECIPIENT.PRIVATE_KEY,
          }),
        ]);

        expect(initialPrimary.result.value).toEqual(masterAccountID.address);

        const transferReceipt = await smartContract.transferPrimary.confirmed(recipient.userAccount.id.address, {
          from: masterAccountID,
        });
        const newPrimary = await smartContract.primary.confirmed();
        if (transferReceipt.result.state !== 'HALT') {
          throw new Error(transferReceipt.result.message);
        }
        expect(newPrimary.result.value).toEqual(recipient.userAccount.id.address);

        const bogusTransferReceipt = await smartContract.transferPrimary.confirmed(masterAccountID.address, {
          from: masterAccountID,
        });
        expect(bogusTransferReceipt.result.state).toEqual('FAULT');
        expect(bogusTransferReceipt.result.value).toBeFalsy();

        const finalPrimary = await smartContract.primary.confirmed();
        expect(finalPrimary.result.value).toEqual(recipient.userAccount.id.address);

        const failedResult = await smartContract.primaryOnlyAction.confirmed({
          from: masterAccountID,
        });
        expect(failedResult.result.state).toBe('FAULT');
      },
      { deploy: false },
    );
  });
});
