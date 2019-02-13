import { common, crypto } from '@neo-one/client-common';
import { SmartContractAny } from '@neo-one/client-core';
import { withContracts } from '@neo-one/smart-contract-test';
import * as path from 'path';

const ALTERNATE = {
  PRIVATE_KEY: '9c111f04a34b3a07600fe701d308dce6e20c86268c105f21c2f30e9fef7e7968',
  PUBLIC_KEY: '027f73dbc47133b08a4bc0fc04589fc76525baaf3bebe71bdd78053d559c41db70',
};

describe('TestTransferableOwnership', () => {
  test('deploy + transfer', async () => {
    await withContracts<{ testCapperContract: SmartContractAny }>(
      [
        {
          filePath: path.resolve(__dirname, '..', '__data__', 'contracts', 'TestCapper.ts'),
          name: 'TestCapper',
        },
      ],
      async ({ client, networkName, testCapperContract: smartContract, masterAccountID }) => {
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

        // validate initial state
        const [ownerIsCapperResult, alternateIsCapperResult] = await Promise.all([
          smartContract.isCapper(masterAccountID.address),
          smartContract.isCapper(alternate.userAccount.id.address),
        ]);

        expect(ownerIsCapperResult.result.value).toBeTruthy();
        expect(alternateIsCapperResult.result.value).toBeFalsy();

        const invalidOperationResult = await smartContract.addCapper(
          masterAccountID.address,
          alternate.userAccount.id.address,
        );
        const invalidOperationReceipt = invalidOperationResult.confirmed({ timeoutMS: 2500 });
        expect(invalidOperationReceipt.result.value).toBeFalsy();

        const invalidOperationResult2 = await smartContract.renounceCapper(
          masterAccountID.address,
          alternate.userAccount.id.address,
        );
        const invalidOperationReceipt2 = invalidOperationResult2.confirmed({ timeoutMS: 2500 });
        expect(invalidOperationReceipt2.result.value).toBeFalsy();

        const validOperationResult = await smartContract.addCapper(
          alternate.userAccount.id.address,
          masterAccountID.address,
        );
        const validOperationReceipt = validOperationResult.confirmed({ timeoutMS: 2500 });
        expect(validOperationReceipt.result.value).toBeFalsy();
        expect(validOperationReceipt.result.events).toHaveLength(1);
        expect(validOperationReceipt.result.events[0].name).toEqual('granted capper rights');

        const [ownerIsCapperResultB, alternateIsCapperResultB] = await Promise.all([
          smartContract.isCapper(masterAccountID.address),
          smartContract.isCapper(alternate.userAccount.id.address),
        ]);

        expect(ownerIsCapperResultB.result.value).toBeTruthy();
        expect(alternateIsCapperResultB.result.value).toBeTruthy();

        const validOperationResult2 = await smartContract.renounceCapper(
          masterAccountID.address,
          alternate.userAccount.id.address,
        );
        const validOperationRectip2 = validOperationResult2.confirmed({ timeoutMS: 2500 });
        expect(validOperationRectip2.result.value).toBeTruthy();

        const [ownerIsCapperResultC, alternateIsCapperResultC] = await Promise.all([
          smartContract.isCapper(masterAccountID.address),
          smartContract.isCapper(alternate.userAccount.id.address),
        ]);

        expect(ownerIsCapperResultC.result.value).toBeTruthy();
        expect(alternateIsCapperResultC.result.value).toBeFalsy();
      },
      { deploy: false },
    );
  });
});
