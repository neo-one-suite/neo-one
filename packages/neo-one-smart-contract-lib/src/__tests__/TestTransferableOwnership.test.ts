import { common, crypto } from '@neo-one/client-common';
import { SmartContractAny } from '@neo-one/client-core';
import { withContracts } from '@neo-one/smart-contract-test';
import * as path from 'path';

const RECIPIENT = {
  PRIVATE_KEY: '9c111f04a34b3a07600fe701d308dce6e20c86268c105f21c2f30e9fef7e7968',
  PUBLIC_KEY: '027f73dbc47133b08a4bc0fc04589fc76525baaf3bebe71bdd78053d559c41db70',
};

describe('TestTransferableOwnership', () => {
  test('deploy + transfer', async () => {
    await withContracts<{ testTransferableContract: SmartContractAny }>(
      [
        {
          filePath: path.resolve(__dirname, '..', '__data__', 'contracts', 'TestTransferableContract.ts'),
          name: 'TestTransferableContract',
        },
      ],
      async ({ client, networkName, testTransferableContract: smartContract, masterAccountID }) => {
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

        const [origOwnerResult, recipient] = await Promise.all([
          smartContract.owner(),

          client.providers.memory.keystore.addUserAccount({
            network: networkName,
            name: 'recipient',
            privateKey: RECIPIENT.PRIVATE_KEY,
          }),
        ]);

        expect(origOwnerResult.toString()).toEqual(masterAccountID.address);

        const firstTransferResult = await smartContract.transferContract(
          recipient.userAccount.id.address,

          { from: masterAccountID },
        );

        const firstTransferReceipt = await firstTransferResult.confirmed({ timeoutMS: 2500 });
        if (firstTransferReceipt.result.state !== 'HALT') {
          throw new Error(firstTransferReceipt.result.message);
        }
        expect(firstTransferReceipt.events).toHaveLength(1);
        const initEvent = firstTransferReceipt.events[0];
        expect(initEvent.name).toEqual('contract ownership transfer initiated');
        const initOwnerResult = await smartContract.owner();
        expect(initOwnerResult.toString()).toEqual(masterAccountID.address);

        const canceledOwnerResult = await smartContract.transferContract(
          masterAccountID.address,

          { from: masterAccountID },
        );
        const canceledOwnerReceipt = await canceledOwnerResult.confirmed({ timeoutMS: 2500 });
        expect(canceledOwnerReceipt.events).toHaveLength(1);
        const cancelEvent = canceledOwnerReceipt.events[0];
        expect(cancelEvent.name).toEqual('contract ownership transfer canceled');
        const cancelOwnerResult = await smartContract.owner();
        expect(cancelOwnerResult.toString()).toEqual(masterAccountID.address);

        const bogusClaimResult = await smartContract.transferContract(recipient.userAccount.id.address, {
          from: recipient.userAccount.id,
        });
        const bogusClaimReceipt = await bogusClaimResult.confirmed({ timeoutMS: 2500 });
        expect(bogusClaimReceipt.value).toBeFalsy();

        const init2TransferResult = await smartContract.transferContract(recipient.userAccount.id.address, {
          from: masterAccountID,
        });
        const init2TransferReceipt = await init2TransferResult.confirmed({ timeoutMS: 2500 });
        expect(init2TransferReceipt.events).toHaveLength(1);
        const init2Event = init2TransferReceipt.events[0];
        expect(init2Event.name).toEqual('contract ownership transfer initiated');

        const finalizeTransferResult = await smartContract.transferContract(recipient.userAccount.id.address, {
          from: recipient.userAccount.id,
        });
        const finalizeTransferReceipt = await finalizeTransferResult.confirmed({ timeoutMS: 2500 });
        expect(finalizeTransferReceipt.events).toHaveLength(1);
        const finalEvent = finalizeTransferReceipt.events[0];
        expect(finalEvent.name).toEqual('contract ownership transfer');

        const finalOwnerResult = await smartContract.owner();
        expect(finalOwnerResult.toString()).toEqual(recipient.userAccount.id.address);
      },
      { deploy: false },
    );
  });
});
