import { common, crypto } from '@neo-one/client-common';
import { SmartContractAny } from '@neo-one/client-core';
import { withContracts } from '@neo-one/smart-contract-test';
import * as path from 'path';

const ALTERNATE = {
  PRIVATE_KEY: '7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344',
  PUBLIC_KEY: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
};

describe('test pauser access role', () => {
  test('deploy, initialize, add, remove', async () => {
    await withContracts<{ testPauser: SmartContractAny }>(
      [
        {
          filePath: path.resolve(
            __dirname,
            '..',
            '..',
            '..',
            '__data__',
            'contracts',
            'access',
            'roles',
            'TestPauser.ts',
          ),
          name: 'TestPauser',
        },
      ],
      async ({ client, networkName, testPauser: smartContract, masterAccountID }) => {
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
        const [ownerIsPauserResult, alternateIsPauserResult] = await Promise.all([
          smartContract.isPauser(masterAccountID.address),
          smartContract.isPauser(alternate.userAccount.id.address),
        ]);

        expect(ownerIsPauserResult).toBeTruthy();
        expect(alternateIsPauserResult).toBeFalsy();

        /* blatant lie */
        const invalidOpResult = await smartContract.addPauser(
          alternate.userAccount.id.address,
          masterAccountID.address,
          {
            from: alternate.userAccount.id,
          },
        );
        const invalidOpReceipt = await invalidOpResult.confirmed({ timeoutMS: 5500 });
        if (invalidOpReceipt.result.state !== 'HALT') {
          throw new Error(invalidOpReceipt.result.message);
        }

        expect(invalidOpReceipt).toBeTruthy();

        /* you cannot remove someone that is not on the list */
        const invalidOpResult2 = await smartContract.removePauser(
          masterAccountID.address,
          alternate.userAccount.id.address,
          { from: alternate.userAccount.id },
        );
        const invalidOpReceipt2 = await invalidOpResult2.confirmed({ timeoutMS: 2500 });
        if (invalidOpReceipt2.result.state !== 'HALT') {
          throw new Error(invalidOpReceipt2.result.message);
        }

        expect(invalidOpReceipt2.result.value).toBeFalsy();

        const validOpResult = await smartContract.addPauser(alternate.userAccount.id.address, masterAccountID.address, {
          from: masterAccountID,
        });
        const validOpReceipt = await validOpResult.confirmed({ timeoutMS: 2500 });
        if (validOpReceipt.result.state !== 'HALT') {
          throw new Error(validOpReceipt.result.message);
        }

        expect(validOpReceipt.result.value).toBeTruthy();
        expect(validOpReceipt.events).toHaveLength(1);
        expect(validOpReceipt.events[0].name).toEqual('add pauser');

        const [ownerIsPauserResultB, alternateIsPauserResultB] = await Promise.all([
          smartContract.isPauser(masterAccountID.address, { from: masterAccountID }),
          smartContract.isPauser(alternate.userAccount.id.address, { from: alternate.userAccount.id }),
        ]);

        expect(ownerIsPauserResultB).toBeTruthy();
        expect(alternateIsPauserResultB).toBeTruthy();

        const validOpResult2 = await smartContract.removePauser(
          masterAccountID.address,
          alternate.userAccount.id.address,
          { from: alternate.userAccount.id },
        );
        const validOpReceipt2 = await validOpResult2.confirmed({ timeoutMS: 2500 });
        if (validOpReceipt2.result.state !== 'HALT') {
          throw new Error(validOpReceipt2.result.message);
        }
        expect(validOpReceipt2.result.value).toBeTruthy();
        expect(validOpReceipt2.events).toHaveLength(1);
        expect(validOpReceipt2.events[0].name).toEqual('remove pauser');

        const [ownerIsPauserResultC, alternateIsPauserResultC] = await Promise.all([
          smartContract.isPauser(masterAccountID.address),
          smartContract.isPauser(alternate.userAccount.id.address),
        ]);

        expect(alternateIsPauserResultC).toBeTruthy();
        expect(ownerIsPauserResultC).toBeFalsy();
      },
      { deploy: false },
    );
  });
});
