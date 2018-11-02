// tslint:disable
import BigNumber from 'bignumber.js';
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(30000);

describe('Token', () => {
  test('can pre-approve and revoke transfers', async () => {
    // @ts-ignore
    await withContracts(async ({ token, masterAccountID, accountIDs }) => {
      // `accountIDs` contains accounts with NEO and GAS and they are preconfigured in the `client`
      const toAccountID = accountIDs[0];

      // Pre-approve a transfer
      const amount = new BigNumber(100);
      const approveReceipt = await token.approveSendTransfer.confirmed(
        masterAccountID.address,
        toAccountID.address,
        amount,
      );
      if (approveReceipt.result.state === 'FAULT') {
        throw new Error(approveReceipt.result.message);
      }
      expect(approveReceipt.result.state).toEqual('HALT');
      expect(approveReceipt.result.value).toEqual(true);
      expect(approveReceipt.events).toHaveLength(1);
      let event = approveReceipt.events[0];
      expect(event.name).toEqual('approveSendTransfer');
      if (event.name !== 'approveSendTransfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.by).toEqual(toAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(amount.toNumber());

      // Verify the approved amount matches above.
      let approvedAmount = await token.approvedTransfer(masterAccountID.address, toAccountID.address);
      expect(approvedAmount.toNumber()).toEqual(amount.toNumber());

      // Revoke part of the approval
      const revokeAmount = new BigNumber(25);
      const revokeReceipt = await token.revokeSendTransfer.confirmed(
        masterAccountID.address,
        toAccountID.address,
        revokeAmount,
      );
      if (revokeReceipt.result.state === 'FAULT') {
        throw new Error(revokeReceipt.result.message);
      }
      expect(revokeReceipt.result.state).toEqual('HALT');
      expect(revokeReceipt.result.value).toEqual(true);
      expect(revokeReceipt.events).toHaveLength(1);
      event = revokeReceipt.events[0];
      expect(event.name).toEqual('revokeSendTransfer');
      if (event.name !== 'revokeSendTransfer') {
        throw new Error('For TS');
      }
      expect(event.parameters.from).toEqual(masterAccountID.address);
      expect(event.parameters.by).toEqual(toAccountID.address);
      expect(event.parameters.amount.toNumber()).toEqual(revokeAmount.toNumber());

      // Verify the approved amount is updated to reflect the revoked amount
      approvedAmount = await token.approvedTransfer(masterAccountID.address, toAccountID.address);
      expect(approvedAmount.toNumber()).toEqual(amount.minus(revokeAmount).toNumber());
    });
  });
});
