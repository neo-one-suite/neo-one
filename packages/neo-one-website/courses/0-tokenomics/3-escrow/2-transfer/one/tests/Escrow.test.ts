// tslint:disable
import { Hash256 } from '@neo-one/client';
import BigNumber from 'bignumber.js';
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(60000);

describe('Escrow', () => {
  test('can deposit funds', async () => {
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
    });
  });
});
