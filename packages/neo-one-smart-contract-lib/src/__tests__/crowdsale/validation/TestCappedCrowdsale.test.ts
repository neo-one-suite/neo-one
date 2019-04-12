import { common, crypto } from '@neo-one/client-common';
import { Hash256, SmartContractAny } from '@neo-one/client-core';
import { withContracts } from '@neo-one/smart-contract-test';
import * as path from 'path';
import BigNumber from 'bignumber.js';

const RECIPIENT = {
  PRIVATE_KEY: '7d128a6d096f0c14c3a25a2b0c41cf79661bfcb4a8cc95aaaea28bde4d732344',
  PUBLIC_KEY: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
};

describe('Capped Crowdsale', () => {
  test('deploy + transfer', async () => {
    await withContracts<{ testCappedCrowdsale: SmartContractAny }>(
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
            'TestCappedCrowdsale.ts',
          ),
          name: 'TestCappedCrowdsale',
        },
      ],
      async ({ testCappedCrowdsale: smartContract, accountIDs, masterAccountID }) => {
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

        const [cap, neoRaised] = await Promise.all([smartContract.cap(), smartContract.neoRaised()]);

        expect(cap.toNumber()).toEqual(99);
        expect(neoRaised.toNumber()).toEqual(0);

        const fistPurchase = await smartContract.mintTokens.confirmed({
          sendTo: [
            {
              amount: new BigNumber(10),
              asset: Hash256.NEO,
            },
          ],
          from: accountIDs[5],
        });

        const raisedUpdate1 = await smartContract.neoRaised();
        expect(raisedUpdate1.toNumber()).toBe(10);

        const secondPurchase = await smartContract.mintTokens.confirmed({
          sendTo: [
            {
              amount: new BigNumber(80),
              asset: Hash256.NEO,
            },
          ],
          from: accountIDs[5],
        });
        const raisedUpdate2 = await smartContract.neoRaised();
        expect(raisedUpdate2.toNumber()).toBe(90);

        const lastPurchase = await smartContract.mintTokens.confirmed({
          sendTo: [
            {
              amount: new BigNumber(9),
              asset: Hash256.NEO,
            },
          ],
          from: accountIDs[5],
        });

        const lastBalanceCheck = await smartContract.neoRaised();

        const capReached = await smartContract.capReached();
        expect(capReached).toBeTruthy();
        try {
          const invalidPurchaseResult = await smartContract.mintTokens.confirmed({
            sendTo: [
              {
                amount: new BigNumber(10),
                asset: Hash256.NEO,
              },
            ],
            from: accountIDs[5],
          });
          expect(invalidPurchaseResult.result.state).toEqual('FAULT');
        } catch (e) {
          // not expecting to catch the "fault" this way: See Ownable Tests
        }
      },
      { deploy: false },
    );
  });
});
