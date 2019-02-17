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
    await withContracts<{ testPausable: SmartContractAny }>(
      [
        {
          filePath: path.resolve(__dirname, '..', '..', '__data__', 'contracts', 'lifecycle', 'TestPausable.ts'),
          name: 'TestPausable',
        },
      ],
      async ({ client, networkName, testPausable: smartContract, masterAccountID }) => {
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

        // setup alternate account

        const alternate = await client.providers.memory.keystore.addUserAccount({
          network: networkName,
          name: 'alternate',
          privateKey: ALTERNATE.PRIVATE_KEY,
        });

        // Check state
        // test functions

        const [
          initialPauseState,
          ownerIsPauser,
          alternateIsPauser,
          resultPauseOnlyActivity,
          resultUnpausedOnlyActivity,
        ] = await Promise.all([
          smartContract.isPaused(),
          smartContract.isPauser(masterAccountID.address),
          smartContract.isPauser(alternate.userAccount.id.address),
          smartContract.doPauseOnlyActivity(),
          smartContract.doUnpausedOnlyActivity(),
        ]);
        expect(initialPauseState).toBeFalsy();
        expect(ownerIsPauser).toBeTruthy();
        expect(alternateIsPauser).toBeFalsy();
        expect(resultPauseOnlyActivity).toBeFalsy();
        expect(resultUnpausedOnlyActivity).toBeTruthy();

        const [badRequestResult, badAddPauserResult] = await Promise.all([
          smartContract.pause(alternate.userAccount.id.address, {
            from: alternate.userAccount.id,
          }),
          smartContract.addPauser(alternate.userAccount.id.address, alternate.userAccount.id.address, {
            from: alternate.userAccount.id,
          }),
        ]);

        const badRequestReceipt = await badRequestResult.confirmed({ timeoutMS: 2500 });
        if (badRequestReceipt.result.state !== 'HALT') {
          throw new Error(badRequestReceipt.result.message);
        }

        const badAddPauserReceipt = await badAddPauserResult.confirmed({ timeoutMS: 2500 });
        if (badAddPauserReceipt.result.state !== 'HALT') {
          throw new Error(badAddPauserReceipt.result.message);
        }

        expect(badRequestReceipt.result.value).toBeFalsy();

        expect(badAddPauserReceipt.result.value).toBeFalsy();

        const [pauseResult, addPauserResult, removeSelfResult] = await Promise.all([
          smartContract.pause(masterAccountID.address, { from: masterAccountID }),
          smartContract.addPauser(alternate.userAccount.id.address, masterAccountID.address, { from: masterAccountID }),
          smartContract.removePauser(masterAccountID.address, masterAccountID.address, { from: masterAccountID }),
        ]);
        const pauseReceipt = await pauseResult.confirmed({ timeoutMS: 2500 });
        if (pauseReceipt.result.state !== 'HALT') {
          throw new Error(pauseReceipt.result.message);
        }
        const removeSelfReceipt = await removeSelfResult.confirmed({ timeoutMS: 2500 });
        if (removeSelfReceipt.result.state !== 'HALT') {
          throw new Error(removeSelfReceipt.result.message);
        }
        expect(removeSelfReceipt.result.value).toBeFalsy();
        expect(pauseReceipt.result.value).toBeTruthy();

        expect(pauseReceipt.events).toHaveLength(1);
        expect(pauseReceipt.events[0].name).toEqual('paused');

        const addPauserReceipt = await addPauserResult.confirmed({ timeoutMS: 2500 });
        if (addPauserReceipt.result.state !== 'HALT') {
          throw new Error(addPauserReceipt.result.message);
        }
        expect(addPauserReceipt.result.value).toBeTruthy();
        expect(addPauserReceipt.events).toHaveLength(1);
        expect(addPauserReceipt.events[0].name).toEqual('add pauser');

        const pauserRemovesAnotherPauserResult = await smartContract.removePauser(
          masterAccountID.address,
          alternate.userAccount.id.address,
          { from: alternate.userAccount.id },
        );
        const pauserRemovesAnotherPauserReciept = await pauserRemovesAnotherPauserResult.confirmed({ timeoutMS: 2500 });
        if (pauserRemovesAnotherPauserReciept.result.state !== 'HALT') {
          throw new Error(pauserRemovesAnotherPauserReciept.result.message);
        }

        const [
          midPauseState,
          ownerIsPauserB,
          alternateIsPauserB,
          resultPauseOnlyActivityB,
          resultUnpausedOnlyActivityB,
        ] = await Promise.all([
          smartContract.isPaused(),
          smartContract.isPauser(masterAccountID.address),
          smartContract.isPauser(alternate.userAccount.id.address),
          smartContract.doPauseOnlyActivity(),
          smartContract.doUnpausedOnlyActivity(),
        ]);
        expect(midPauseState).toBeTruthy();
        expect(ownerIsPauserB).toBeFalsy();
        expect(alternateIsPauserB).toBeTruthy();
        expect(resultUnpausedOnlyActivityB).toBeFalsy();
        expect(resultPauseOnlyActivityB).toBeTruthy();
      },
      { deploy: false },
    );
  });
});
