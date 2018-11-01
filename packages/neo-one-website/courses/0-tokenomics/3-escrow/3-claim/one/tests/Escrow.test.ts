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
      const additionalAmount = new BigNumber(50);
      const escrowAddress = escrow.definition.networks[networkName].address;
      const approveReceipt = await token.approveSendTransfer.confirmed(
        masterAccountID.address,
        escrowAddress,
        escrowAmount.plus(additionalAmount),
      );
      if (approveReceipt.result.state === 'FAULT') {
        throw new Error(approveReceipt.result.message);
      }
      expect(approveReceipt.result.value).toEqual(true);

      const depositReceipt = await escrow.deposit.confirmed(
        masterAccountID.address,
        toWallet.account.id.address,
        escrowAmount,
      );
      if (depositReceipt.result.state === 'FAULT') {
        throw new Error(depositReceipt.result.message);
      }
      expect(depositReceipt.result.value).toEqual(true);
      let event = depositReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.to).toEqual(escrowAddress);
      expect(event.parameters.amount.toNumber()).toEqual(escrowAmount.toNumber());

      event = depositReceipt.events[1];
      expect(event.name).toEqual('balanceAvailable');
      if (event.name !== 'balanceAvailable') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.to).toEqual(toWallet.account.id.address);
      expect(event.parameters.amount.toNumber()).toEqual(escrowAmount.toNumber());

      let balance = await escrow.balanceOf(masterAccountID.address, toWallet.account.id.address);
      expect(balance.toNumber()).toEqual(escrowAmount.toNumber());

      const failedDepositReceipt = await escrow.deposit.confirmed(
        masterAccountID.address,
        toWallet.account.id.address,
        additionalAmount.plus(1),
      );
      if (failedDepositReceipt.result.state === 'FAULT') {
        throw new Error(failedDepositReceipt.result.message);
      }
      expect(failedDepositReceipt.result.value).toEqual(false);

      balance = await escrow.balanceOf(masterAccountID.address, toWallet.account.id.address);
      expect(balance.toNumber()).toEqual(escrowAmount.toNumber());

      const claimAmount = escrowAmount.dividedBy(2);
      const claimReceipt = await escrow.claim.confirmed(
        masterAccountID.address,
        toWallet.account.id.address,
        claimAmount,
        { from: toWallet.account.id },
      );
      if (claimReceipt.result.state === 'FAULT') {
        throw new Error(claimReceipt.result.message);
      }
      expect(claimReceipt.result.value).toEqual(true);
      event = claimReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(escrowAddress);
      expect(event.parameters.to).toEqual(toWallet.account.id.address);
      expect(event.parameters.amount.toNumber()).toEqual(claimAmount.toNumber());

      event = claimReceipt.events[1];
      expect(event.name).toEqual('balanceClaimed');
      if (event.name !== 'balanceClaimed') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.to).toEqual(toWallet.account.id.address);
      expect(event.parameters.amount.toNumber()).toEqual(claimAmount.toNumber());

      balance = await escrow.balanceOf(masterAccountID.address, toWallet.account.id.address);
      expect(balance.toNumber()).toEqual(escrowAmount.minus(claimAmount).toNumber());

      const failedClaimReceipt = await escrow.claim.confirmed(
        masterAccountID.address,
        toWallet.account.id.address,
        claimAmount.plus(1),
        { from: toWallet.account.id },
      );
      if (failedClaimReceipt.result.state === 'FAULT') {
        throw new Error(failedClaimReceipt.result.message);
      }
      expect(failedClaimReceipt.result.value).toEqual(false);

      balance = await escrow.balanceOf(masterAccountID.address, toWallet.account.id.address);
      expect(balance.toNumber()).toEqual(escrowAmount.minus(claimAmount).toNumber());

      let error: Error | undefined;
      try {
        await escrow.claim.confirmed(masterAccountID.address, toWallet.account.id.address, new BigNumber(-1), {
          from: toWallet.account.id,
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
  });
});
