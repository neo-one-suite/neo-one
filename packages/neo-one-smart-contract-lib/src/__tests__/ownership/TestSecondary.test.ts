import { common, crypto } from '@neo-one/client-common';
import { SmartContractAny } from '@neo-one/client-core';
import { withContracts } from '@neo-one/smart-contract-test';
import * as path from 'path';

const RECIPIENT = {
  PRIVATE_KEY: '9c111f04a34b3a07600fe701d308dce6e20c86268c105f21c2f30e9fef7e7968',
  PUBLIC_KEY: '027f73dbc47133b08a4bc0fc04589fc76525baaf3bebe71bdd78053d559c41db70',
};

describe('Secondary', () => {
  test('deploy + transfer', async () => {
    await withContracts<{ testSecondary: SmartContractAny }>(
      [
        {
          filePath: path.resolve(__dirname, '..', '..', '__data__', 'contracts', 'ownership', 'TestSecondary.ts'),
          name: 'TestSecondary',
        },
      ],
      async ({ client, networkName, testSecondary: smartContract, masterAccountID }) => {
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

        const [origPrimary, recipient] = await Promise.all([
          smartContract.primary.confirmed(),
          client.providers.memory.keystore.addUserAccount({
            network: networkName,
            name: 'recipient',
            privateKey: RECIPIENT.PRIVATE_KEY,
          }),
        ]);

        expect(origPrimary.result.value.toString()).toEqual(masterAccountID.address);

        const transferReceipt = await smartContract.transferPrimary.confirmed(recipient.userAccount.id.address, {
          from: masterAccountID,
        });
        expect(transferReceipt.events).toHaveLength(1);

        const txEvent = transferReceipt.events[0];
        expect(txEvent.name).toEqual('transfer_primary');

        const transferredPrimary = await smartContract.primary.confirmed();
        expect(transferredPrimary.result.value.toString()).toEqual(recipient.userAccount.id.address);

        const invalidTransferReceipt = await smartContract.transferPrimary.confirmed(recipient.userAccount.id.address, {
          from: masterAccountID,
        });

        expect(invalidTransferReceipt.result.state).toEqual('FAULT');

        const finalPrimary = await smartContract.primary.confirmed();
        expect(finalPrimary.result.value.toString()).toEqual(recipient.userAccount.id.address);
      },
      { deploy: false },
    );
  });
});
