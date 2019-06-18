// tslint:disable
import { Hash256 } from '@neo-one/client';
import BigNumber from 'bignumber.js';
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(60000);

describe('Escrow', () => {
  test('holds funds claimable by two parties', async () => {
    // @ts-ignore
    await withContracts(async ({ token, escrow, developerClient, masterAccountID, networkName, accountIDs }) => {
      expect(token).toBeDefined();
      expect(escrow).toBeDefined();

      // `accountIDs` contains accounts with NEO and GAS and they are preconfigured in the `client`
      const toAccountID = accountIDs[0];

      // Fast forward to the start of the ICO so that we can mint some tokens.
      await developerClient.fastForwardOffset(60 * 60);
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
      expect(mintReceipt.result.value).toBeUndefined();

      // Deposit into the Escrow account
      const escrowAmount = new BigNumber(100);
      const escrowAddress = escrow.definition.networks[networkName].address;
      const escrowReceipt = await token.transfer.confirmed(
        masterAccountID.address,
        escrowAddress,
        escrowAmount,
        ...escrow.forwardApproveReceiveTransferArgs(toAccountID.address),
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
      expect(event.parameters.to).toEqual(toAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(escrowAmount.toNumber());
      const tokenAddress = token.definition.networks[networkName].address;
      expect(event.parameters.asset).toEqual(tokenAddress);
      event = escrowReceipt.events[1];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.to).toEqual(escrowAddress);
      expect(event.parameters.amount.toNumber()).toEqual(escrowAmount.toNumber());

      // Verify the escrow balance matches the above.
      let balance = await escrow.balanceOf(masterAccountID.address, toAccountID.address, tokenAddress);
      expect(balance.toNumber()).toEqual(escrowAmount.toNumber());

      // Claim half of the escrow balance
      const claimAmount = escrowAmount.dividedBy(2);
      const claimReceipt = await escrow.claim.confirmed(
        masterAccountID.address,
        toAccountID.address,
        claimAmount,
        tokenAddress,
        // Set the from address as the toAccountID since only the `to` address should be able to claim from the Escrow account.
        { from: toAccountID },
      );
      if (claimReceipt.result.state === 'FAULT') {
        throw new Error(claimReceipt.result.message);
      }
      expect(claimReceipt.result.value).toBeUndefined();
      // Notice how the receipt has the events for both the Token contract we invoked as well as the Escrow contract.
      event = claimReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(escrowAddress);
      expect(event.parameters.to).toEqual(toAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(claimAmount.toNumber());
      event = claimReceipt.events[1];
      expect(event.name).toEqual('balanceClaimed');
      if (event.name !== 'balanceClaimed') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.to).toEqual(toAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(claimAmount.toNumber());
      expect(event.parameters.asset).toEqual(tokenAddress);

      // Verify the escrow balance has been deducted
      balance = await escrow.balanceOf(masterAccountID.address, toAccountID.address, tokenAddress);
      expect(balance.toNumber()).toEqual(escrowAmount.minus(claimAmount).toNumber());

      // Try claiming the remainder + 1 (i.e. more than the balance of the escrow account)
      const failedClaimReceipt = await escrow.claim.confirmed(
        masterAccountID.address,
        toAccountID.address,
        claimAmount.plus(1),
        tokenAddress,
        { from: toAccountID },
      );
      if (failedClaimReceipt.result.state === 'FAULT') {
        throw new Error(failedClaimReceipt.result.message);
      }
      expect(failedClaimReceipt.result.value).toEqual(false);

      // Verify the escrow balance is still the same.
      balance = await escrow.balanceOf(masterAccountID.address, toAccountID.address, tokenAddress);
      expect(balance.toNumber()).toEqual(escrowAmount.minus(claimAmount).toNumber());

      // Refund the remainder of the escrow account
      const refundAmount = escrowAmount.minus(claimAmount);
      const refundReceipt = await escrow.refund.confirmed(
        masterAccountID.address,
        toAccountID.address,
        refundAmount,
        tokenAddress,
      );
      if (refundReceipt.result.state === 'FAULT') {
        throw new Error(refundReceipt.result.message);
      }
      expect(refundReceipt.result.value).toBeUndefined();
      event = refundReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(escrowAddress);
      expect(event.parameters.to).toEqual(masterAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(refundAmount.toNumber());
      event = refundReceipt.events[1];
      expect(event.name).toEqual('balanceRefunded');
      if (event.name !== 'balanceRefunded') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.to).toEqual(toAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(refundAmount.toNumber());
      expect(event.parameters.asset).toEqual(tokenAddress);

      // Verify the escrow balance is now 0
      balance = await escrow.balanceOf(masterAccountID.address, toAccountID.address, tokenAddress);
      expect(balance.toNumber()).toEqual(0);

      // Try to refund more (and fail)
      const failedRefundReceipt = await escrow.refund.confirmed(
        masterAccountID.address,
        toAccountID.address,
        new BigNumber(1),
        tokenAddress,
      );
      if (failedRefundReceipt.result.state === 'FAULT') {
        throw new Error(failedRefundReceipt.result.message);
      }
      expect(failedRefundReceipt.result.value).toEqual(false);

      // Verify that claim throws an error in the exceptional case that we pass a negative number
      let error: Error | undefined;
      try {
        await escrow.claim.confirmed(masterAccountID.address, toAccountID.address, new BigNumber(-1), tokenAddress, {
          from: toAccountID,
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();

      // Verify that refund throws an error in the exceptional case that we pass a negative number
      error = undefined;
      try {
        await escrow.refund.confirmed(masterAccountID.address, toAccountID.address, new BigNumber(-1), tokenAddress);
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
  });
});
