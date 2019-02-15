import { common, crypto } from '@neo-one/client-common';
import { SmartContractAny } from '@neo-one/client-core';
import { withContracts } from '@neo-one/smart-contract-test';
import * as path from 'path';

const ALTERNATE = {
  PRIVATE_KEY: '9c111f04a34b3a07600fe701d308dce6e20c86268c105f21c2f30e9fef7e7968',
  PUBLIC_KEY: '027f73dbc47133b08a4bc0fc04589fc76525baaf3bebe71bdd78053d559c41db70',
};

describe('Test Pausability', () => {
  test('deploy + pause + unpause', async () => {
    await withContracts<{ testPausableContract: SmartContractAny }>(
      [
        {
          filePath: path.resolve(__dirname, '..', '..', '__data__', 'contracts', 'lifecycle', 'TestPausable.ts'),
          name: 'TestPausable',
        },
      ],
      async ({ client, networkName, testPausableContract: smartContract, masterAccountID }) => {
        crypto.addPublicKey(
          common.stringToPrivateKey(ALTERNATE.PRIVATE_KEY),
          common.stringToECPoint(ALTERNATE.PUBLIC_KEY),
        );

        const deployResult = await smartContract.deploy(masterAccountID.address, { from: masterAccountID });

        const deployReceipt = await deployResult.confirmed({ timeoutMS: 2500 });
        if (deployReceipt.result.state !== 'HALT') {
          throw new Error(deployReceipt.result.message);
        }

        expect(deployReceipt.result.gasConsumed.toString()).toMatchSnapshot('deploy consumed');
        expect(deployReceipt.result.gasCost.toString()).toMatchSnapshot('deploy cost');
        expect(deployReceipt.result.value).toBeTruthy();

        const alternate = await client.providers.memory.keystore.addUserAccount({
          network: networkName,
          name: 'alternate',
          privateKey: ALTERNATE.PRIVATE_KEY,
        });

        const [initialPauseState, ownerIsPauser, alternateIsPauser] = await Promise.all([
          smartContract.isPaused(),
          smartContract.isPauser(masterAccountID.address),
          smartContract.isPauser(alternate.userAccount.id.address)
        ]);

        expect(initialPauseState).toBeFalsy();
        expect(ownerIsPauser).toBeTruthy();
        expect(alternateIsPauser).toBeFalsy();

        const firstRequestResult = await smartContract.pause(
          alternate.userAccount.id.address
          { from: masterAccountID },
        );

        const firstRequestReceipt = await firstRequestResult.confirmed({ timeoutMS: 2500 });
        if (firstRequestReceipt.result.state !== 'HALT') {
          throw new Error(firstRequestReceipt.result.message);
        }
        expect(firstRequestReceipt.events).toHaveLength(1);
        const initEvent = firstRequestReceipt.events[0];
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

        const bogusClaimResult = await smartContract.transferContract(alternate.userAccount.id.address, {
          from: alternate.userAccount.id,
        });
        const bogusClaimReceipt = await bogusClaimResult.confirmed({ timeoutMS: 2500 });
        expect(bogusClaimReceipt.value).toBeFalsy();

        const init2TransferResult = await smartContract.transferContract(alternate.userAccount.id.address, {
          from: masterAccountID,
        });
        const init2TransferReceipt = await init2TransferResult.confirmed({ timeoutMS: 2500 });
        expect(init2TransferReceipt.events).toHaveLength(1);
        const init2Event = init2TransferReceipt.events[0];
        expect(init2Event.name).toEqual('contract ownership transfer initiated');

        const finalizeTransferResult = await smartContract.transferContract(alternate.userAccount.id.address, {
          from: alternate.userAccount.id,
        });
        const finalizeTransferReceipt = await finalizeTransferResult.confirmed({ timeoutMS: 2500 });
        expect(finalizeTransferReceipt.events).toHaveLength(1);
        const finalEvent = finalizeTransferReceipt.events[0];
        expect(finalEvent.name).toEqual('contract ownership transfer');

        const finalOwnerResult = await smartContract.owner();
        expect(finalOwnerResult.toString()).toEqual(alternate.userAccount.id.address);
      },
      { deploy: false },
    );
  });
});
