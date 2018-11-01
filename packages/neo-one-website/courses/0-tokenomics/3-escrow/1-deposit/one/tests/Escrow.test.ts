// tslint:disable
import { createPrivateKey, Hash256 } from '@neo-one/client';
import BigNumber from 'bignumber.js';
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(30000);

describe('Escrow', () => {
  test('can deposit funds', async () => {
    // @ts-ignore
    await withContracts(async ({ token, escrow, developerClient, masterAccountID, networkName, client }) => {
      expect(token).toBeDefined();
      expect(escrow).toBeDefined();

      await developerClient.fastForwardOffset(60 * 60);

      const [toWallet] = await Promise.all([
        // Add a wallet to the client
        client.providers.memory.keystore.addAccount({
          network: networkName,
          privateKey: createPrivateKey(),
        }),
        // Fast forward to the start of the ICO
        developerClient.fastForwardOffset(60 * 60),
      ]);

      // Mint tokens so we have some available to use in the Escrow
      const mintNEOAmount = new BigNumber(10);
      const mintReceipt = await token.mintTokens.confirmed({
        sendTo: [
          {
            amount: mintNEOAmount,
            asset: Hash256.NEO,
          },
        ],
      });
      if (mintReceipt.result.state === 'FAULT') {
        throw new Error(mintReceipt.result.message);
      }
      expect(mintReceipt.result.value).toEqual(true);

      // Pre-approve the transfer by the Escrow account
      const escrowAmount = new BigNumber(100);
      const escrowAddress = escrow.definition.networks[networkName].address;
      const approveReceipt = await token.approveSendTransfer.confirmed(
        masterAccountID.address,
        escrowAddress,
        escrowAmount,
      );
      if (approveReceipt.result.state === 'FAULT') {
        throw new Error(approveReceipt.result.message);
      }
      expect(approveReceipt.result.value).toEqual(true);

      const escrowReceipt = await escrow.deposit.confirmed(
        masterAccountID.address,
        toWallet.account.id.address,
        escrowAmount,
      );
      if (escrowReceipt.result.state === 'FAULT') {
        throw new Error(escrowReceipt.result.message);
      }
      expect(escrowReceipt.result.value).toEqual(true);
      let event = escrowReceipt.events[0];
      expect(event.name).toEqual('balanceAvailable');
      if (event.name !== 'balanceAvailable') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.to).toEqual(toWallet.account.id.address);
      expect(event.parameters.amount.toNumber()).toEqual(escrowAmount.toNumber());

      const escrowBalance = await escrow.balanceOf(masterAccountID.address, toWallet.account.id.address);
      expect(escrowBalance.toNumber()).toEqual(escrowAmount.toNumber());
    });
  });
});
