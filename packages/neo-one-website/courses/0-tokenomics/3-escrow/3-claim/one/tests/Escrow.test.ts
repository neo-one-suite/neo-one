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

      // Deposit into the Escrow account
      const escrowReceipt = await escrow.deposit.confirmed(masterAccountID.address, toAccountID.address, escrowAmount);
      if (escrowReceipt.result.state === 'FAULT') {
        throw new Error(escrowReceipt.result.message);
      }
      expect(escrowReceipt.result.value).toEqual(true);
      let event = escrowReceipt.events[0];
      expect(event.name).toEqual('transfer');
      if (event.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.to).toEqual(escrowAddress);
      expect(event.parameters.amount.toNumber()).toEqual(escrowAmount.toNumber());
      event = escrowReceipt.events[1];
      expect(event.name).toEqual('balanceAvailable');
      if (event.name !== 'balanceAvailable') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.to).toEqual(toAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(escrowAmount.toNumber());

      // Verify the escrow balance matches the above.
      let balance = await escrow.balanceOf(masterAccountID.address, toAccountID.address);
      expect(balance.toNumber()).toEqual(escrowAmount.toNumber());

      // Try depositing more than is pre-approved
      const failedDepositReceipt = await escrow.deposit.confirmed(
        masterAccountID.address,
        toAccountID.address,
        additionalAmount.plus(1),
      );
      if (failedDepositReceipt.result.state === 'FAULT') {
        throw new Error(failedDepositReceipt.result.message);
      }
      expect(failedDepositReceipt.result.value).toEqual(false);

      // Verify the balance is still the same since the deposit failed.
      balance = await escrow.balanceOf(masterAccountID.address, toAccountID.address);
      expect(balance.toNumber()).toEqual(escrowAmount.toNumber());

      // Claim half of the escrow balance
      const claimAmount = escrowAmount.dividedBy(2);
      const claimReceipt = await escrow.claim.confirmed(
        masterAccountID.address,
        toAccountID.address,
        claimAmount,
        // Set the from address as the toAccountID since only the `to` address should be able to claim from the Escrow account.
        { from: toAccountID },
      );
      if (claimReceipt.result.state === 'FAULT') {
        throw new Error(claimReceipt.result.message);
      }
      expect(claimReceipt.result.value).toEqual(true);
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

      // Verify the escrow balance has been deducted
      balance = await escrow.balanceOf(masterAccountID.address, toAccountID.address);
      expect(balance.toNumber()).toEqual(escrowAmount.minus(claimAmount).toNumber());

      // Try claiming the remainder + 1 (i.e. more than the balance of the escrow account)
      const failedClaimReceipt = await escrow.claim.confirmed(
        masterAccountID.address,
        toAccountID.address,
        claimAmount.plus(1),
        { from: toAccountID },
      );
      if (failedClaimReceipt.result.state === 'FAULT') {
        throw new Error(failedClaimReceipt.result.message);
      }
      expect(failedClaimReceipt.result.value).toEqual(false);

      // Verify the escrow balance is still the same.
      balance = await escrow.balanceOf(masterAccountID.address, toAccountID.address);
      expect(balance.toNumber()).toEqual(escrowAmount.minus(claimAmount).toNumber());

      // Verify that claim throws an error in the exceptional case that we pass a negative number
      let error: Error | undefined;
      try {
        await escrow.claim.confirmed(masterAccountID.address, toAccountID.address, new BigNumber(-1), {
          from: toAccountID,
        });
      } catch (err) {
        error = err;
      }
      expect(error).toBeDefined();
    });
  });
});
