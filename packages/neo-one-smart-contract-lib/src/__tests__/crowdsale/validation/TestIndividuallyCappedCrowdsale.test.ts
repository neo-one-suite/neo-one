import { common, crypto } from '@neo-one/client-common';
import { Hash256, SmartContractAny } from '@neo-one/client-core';
import { withContracts } from '@neo-one/smart-contract-test';
import BigNumber from 'bignumber.js';
import * as path from 'path';
import { keys } from '../../../__data__/keys';

const RECIPIENT = {
  PRIVATE_KEY: '7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344',
  PUBLIC_KEY: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
};

describe('IndividuallyCappedCrowdsale', () => {
  test('deploy + transfer', async () => {
    await withContracts<{ testIndividuallyCappedCrowdsale: SmartContractAny }>(
      [
        {
          filePath: path.resolve(
            __dirname,
            '..',
            '..',
            '..',
            '__data__',
            'contracts',
            'crowdsale',
            'validation',
            'TestIndividuallyCappedCrowdsale.ts',
          ),
          name: 'TestIndividuallyCappedCrowdsale',
        },
      ],
      async ({ client, networkName, accountIDs, testIndividuallyCappedCrowdsale: smartContract, masterAccountID }) => {
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
        const [accountOne, accountTwo] = await Promise.all([
          client.providers.memory.keystore.addUserAccount({
            network: networkName,
            name: 'accountOne',
            privateKey: keys[1].privateKeyString,
          }),
          client.providers.memory.keystore.addUserAccount({
            network: networkName,
            name: 'accountTwo',
            privateKey: keys[2].privateKeyString,
          }),
        ]);

        expect(accountOne.userAccount.id.address).toBe(keys[1].address);

        const [initialOwner, initialRate, token, wallet] = await Promise.all([
          smartContract.owner.confirmed({ from: accountOne.userAccount.id }),
          smartContract.rate({ from: accountOne.userAccount.id }),
          smartContract.token({ from: accountTwo.userAccount.id }),
          smartContract.wallet({ from: masterAccountID }),
        ]);

        const masterAccountAddress = keys[0].address;

        expect(initialOwner.result.value).toEqual(masterAccountID.address);
        expect(initialRate.toNumber()).toEqual(1.2);
        expect(wallet.toString()).toEqual(masterAccountAddress);
        expect(token.toString()).toEqual(masterAccountAddress);

        // ### ASSIGN ADDRESSES
        const accountAAddress = accountIDs[2].address;
        const accountBAddress = accountIDs[3].address;
        const accountCAddress = accountIDs[5].address;

        //  GET CURRENT CAPS
        const [cap0a, cap0b, cap0c] = await Promise.all([
          smartContract.getCap(accountAAddress, { from: masterAccountID }),
          smartContract.getCap(accountBAddress, { from: masterAccountID }),
          smartContract.getCap(accountCAddress, { from: masterAccountID }),
        ]);

        expect(cap0a.toNumber()).toEqual(0);
        expect(cap0b.toNumber()).toEqual(0);
        expect(cap0c.toNumber()).toEqual(0);

        // ### SET CAPS to 100, 1000, 10000
        await Promise.all([
          smartContract.setCap.confirmed(accountAAddress, new BigNumber(9), masterAccountID.address, {
            from: masterAccountID,
          }),
          smartContract.setCap.confirmed(accountBAddress, new BigNumber(99), masterAccountID.address, {
            from: masterAccountID,
          }),
          smartContract.setCap.confirmed(accountCAddress, new BigNumber(9999), masterAccountID.address, {
            from: masterAccountID,
          }),
        ]);

        // VERIFY CAP WAS SET PROPERLY
        const [capA, capB, capC] = await Promise.all([
          smartContract.getCap(accountAAddress, { from: masterAccountID }),
          smartContract.getCap(accountBAddress, { from: masterAccountID }),
          smartContract.getCap(accountCAddress, { from: masterAccountID }),
        ]);

        // verify each account has expected remainders
        expect(capA.toNumber()).toEqual(9);
        expect(capB.toNumber()).toEqual(99);
        expect(capC.toNumber()).toEqual(9999);

        await new Promise<void>((resolve) => setTimeout(resolve, 2500));
        const firstPurchaseAResult = await smartContract.mintTokens({
          sendTo: [
            {
              amount: new BigNumber(8),
              asset: Hash256.NEO,
            },
          ],
          from: accountIDs[2],
        });

        const firstPurchaseA = await firstPurchaseAResult.confirmed();
        const firstPurchaseB = await smartContract.mintTokens.confirmed({
          sendTo: [
            {
              amount: new BigNumber(88),
              asset: Hash256.NEO,
            },
          ],
          from: accountIDs[3],
        });

        const firstPurchaseC = await smartContract.mintTokens.confirmed({
          sendTo: [
            {
              amount: new BigNumber(8888.0),
              asset: Hash256.NEO,
            },
          ],
          from: accountIDs[5],
        });

        expect(firstPurchaseA.result.state).toBe('HALT');
        expect(firstPurchaseB.result.state).toBe('HALT');
        expect(firstPurchaseC.result.state).toBe('HALT');

        const [firstContribA, firstContribB, firstContribC] = await Promise.all([
          smartContract.getContributions(accountAAddress, { from: masterAccountID }),
          smartContract.getContributions(accountBAddress, { from: masterAccountID }),
          smartContract.getContributions(accountCAddress, { from: masterAccountID }),
        ]);

        expect(firstContribA.toNumber()).toEqual(8);
        expect(firstContribB.toNumber()).toEqual(88);
        expect(firstContribC.toNumber()).toEqual(8888);

        const Fixed8 = (num: number): number => Math.round(num * 100000000) / 100000000;

        const finalDepositA = Fixed8(capA - firstContribA.toNumber());

        const secondPurchaseA = await smartContract.mintTokens.confirmed({
          sendTo: [
            {
              amount: new BigNumber(finalDepositA),
              asset: Hash256.NEO,
            },
          ],
          from: accountIDs[2],
        });

        const finalDepositB = Fixed8(capB - firstContribB.toNumber());

        let secondPurchaseB;
        try {
          secondPurchaseB = await smartContract.mintTokens.confirmed({
            sendTo: [
              {
                amount: new BigNumber(finalDepositB + 1),
                asset: Hash256.NEO,
              },
            ],
            from: accountIDs[3],
          });
        } catch {
          secondPurchaseB = -1;
        }

        let secondPurchaseC;
        try {
          secondPurchaseC = await smartContract.mintTokens.confirmed(
            masterAccountID.address,
            accountCAddress,
            new BigNumber(-10),
            {
              from: masterAccountID,
            },
          );
        } catch {
          secondPurchaseC = -1;
        }

        expect(secondPurchaseA.result.state).toBe('HALT');
        expect(secondPurchaseB).toBe(-1);
        expect(secondPurchaseC).toBe(-1);
      },
      { deploy: false },
    );
  });
});
