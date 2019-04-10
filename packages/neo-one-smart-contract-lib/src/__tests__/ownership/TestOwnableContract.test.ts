import { common, crypto } from '@neo-one/client-common';
import { SmartContractAny } from '@neo-one/client-core';
import { withContracts } from '@neo-one/smart-contract-test';
import * as path from 'path';

const RECIPIENT = {
  PRIVATE_KEY: '7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344',
  PUBLIC_KEY: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
};

describe('Ownable', () => {
  test('deploy + transfer', async () => {
    await withContracts<{ testOwnable: SmartContractAny }>(
      [
        {
          filePath: path.resolve(__dirname, '..', '..', '__data__', 'contracts', 'ownership', 'TestOwnable.ts'),
          name: 'TestOwnable',
        },
      ],
      async ({ client, networkName, testOwnable: smartContract, masterAccountID }) => {
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
        expect(deployReceipt.result.value).toEqual(true);

        const [initialOwner, recipient] = await Promise.all([
          smartContract.owner.confirmed(),
          client.providers.memory.keystore.addUserAccount({
            network: networkName,
            name: 'recipient',
            privateKey: RECIPIENT.PRIVATE_KEY,
          }),
        ]);

        expect(initialOwner.result.value).toEqual(masterAccountID.address);

        const transferReceipt = await smartContract.transferOwnership.confirmed(recipient.userAccount.id.address, {
          from: masterAccountID,
        });
        const newOwner = await smartContract.owner.confirmed();
        if (transferReceipt.result.state !== 'HALT') {
          throw new Error(transferReceipt.result.message);
        }
        expect(newOwner.result.value).toEqual(recipient.userAccount.id.address);

        const bogusTransferReceipt = await smartContract.transferOwnership.confirmed(masterAccountID.address, {
          from: masterAccountID,
        });
        expect(bogusTransferReceipt.result.state).toEqual('FAULT');
        expect(bogusTransferReceipt.result.value).toBeFalsy();

        const finalOwner = await smartContract.owner.confirmed();
        expect(finalOwner.result.value).toEqual(recipient.userAccount.id.address);

        const renounceReceipt = await smartContract.renounceOwnership.confirmed({
          from: recipient.userAccount.id,
        });
        expect(renounceReceipt.result.state).toEqual('HALT');
        const noOwner = await smartContract.owner.confirmed();
        expect(noOwner.result.value).toEqual(undefined);

        await expect(
          smartContract.publicOwnerOrThrow.confirmed({
            from: recipient.userAccount.id,
          }),
        ).rejects.toBeDefined();
      },
      { deploy: false },
    );
  });
});
