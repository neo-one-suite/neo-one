// tslint:disable
import { Hash256 } from '@neo-one/client';
import BigNumber from 'bignumber.js';
// @ts-ignore
import { withContracts } from '../generated/test';

jest.setTimeout(60000);

describe('CNEO', () => {
  test('can wrap and unwrap NEO and be used as a NEP-5 token', async () => {
    // @ts-ignore
    await withContracts(async ({ cneo, escrow, client, masterAccountID, networkName, accountIDs }) => {
      expect(cneo).toBeDefined();
      expect(escrow).toBeDefined();

      // `accountIDs` contains accounts with NEO and GAS and they are preconfigured in the `client`
      const toAccountID = accountIDs[0];

      // Wrap NEO so we have some available to use in the Escrow
      const neoAmount = new BigNumber(1000);
      const wrapReceipt = await cneo.wrap.confirmed({
        sendTo: [
          {
            amount: neoAmount,
            asset: Hash256.NEO,
          },
        ],
      });
      if (wrapReceipt.result.state === 'FAULT') {
        throw new Error(wrapReceipt.result.message);
      }
      expect(wrapReceipt.result.value).toEqual(true);

      // Pre-approve the transfer by the Escrow account
      const escrowAmount = new BigNumber(100);
      const additionalAmount = new BigNumber(50);
      const escrowAddress = escrow.definition.networks[networkName].address;
      const approveReceipt = await cneo.approveSendTransfer.confirmed(
        masterAccountID.address,
        escrowAddress,
        escrowAmount.plus(additionalAmount),
      );
      if (approveReceipt.result.state === 'FAULT') {
        throw new Error(approveReceipt.result.message);
      }
      expect(approveReceipt.result.value).toEqual(true);

      // Depost into the Escrow account
      const cneoAddress = cneo.definition.networks[networkName].address;
      const cneoAccountID = { network: networkName, address: cneoAddress };
      const escrowReceipt = await escrow.deposit.confirmed(
        masterAccountID.address,
        toAccountID.address,
        escrowAmount,
        cneoAddress,
      );
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
      expect(event.parameters.asset).toEqual(cneoAddress);

      // Verify the escrow balance matches the above.
      let balance = await escrow.balanceOf(masterAccountID.address, toAccountID.address, cneoAddress);
      expect(balance.toNumber()).toEqual(escrowAmount.toNumber());

      // Claim half of the escrow balance
      const claimAmount = escrowAmount.dividedBy(2);
      const claimReceipt = await escrow.claim.confirmed(
        masterAccountID.address,
        toAccountID.address,
        claimAmount,
        cneoAddress,
        // Set the from address as the toAccountID since only the `to` address should be able to claim from the Escrow account.
        { from: toAccountID },
      );
      if (claimReceipt.result.state === 'FAULT') {
        throw new Error(claimReceipt.result.message);
      }
      expect(claimReceipt.result.value).toEqual(true);
      // Notice how the receipt has the events for both the CNEO contract we invoked as well as the Escrow contract.
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
      expect(event.parameters.asset).toEqual(cneoAddress);

      // Verify the escrow balance has been deducted
      balance = await escrow.balanceOf(masterAccountID.address, toAccountID.address, cneoAddress);
      expect(balance.toNumber()).toEqual(escrowAmount.minus(claimAmount).toNumber());

      // Unwrap the claimed CNEO
      const unwrapReceipt = await cneo.unwrap.confirmed(
        {
          amount: claimAmount,
          asset: Hash256.NEO,
          to: toAccountID.address,
        },
        { from: toAccountID },
      );
      if (unwrapReceipt.result.state === 'FAULT') {
        throw new Error(unwrapReceipt.result.message);
      }
      expect(unwrapReceipt.result.value).toEqual(true);
      const unwrapEvent = unwrapReceipt.events[0];
      expect(unwrapEvent.name).toEqual('transfer');
      if (unwrapEvent.name !== 'transfer') {
        throw new Error('For TS');
      }
      expect(unwrapEvent.parameters.from).toEqual(toAccountID.address);
      expect(unwrapEvent.parameters.to).toBeUndefined();
      expect(unwrapEvent.parameters.amount.toNumber()).toEqual(claimAmount.toNumber());

      // Complete the send
      const completeReceipt = await cneo.completeSend.confirmed(unwrapReceipt.transaction.hash, {
        from: toAccountID,
      });
      if (completeReceipt.result.state === 'FAULT') {
        throw new Error(completeReceipt.result.message);
      }
      expect(completeReceipt.result.value).toEqual(true);

      // Verify the balance and total supply have been deducted and that the toAccount has the NEO
      const [masterBalance, toBalance, totalSupply, toAccount, cneoAccountBefore] = await Promise.all([
        cneo.balanceOf(masterAccountID.address),
        cneo.balanceOf(toAccountID.address),
        cneo.totalSupply(),
        client.getAccount(toAccountID),
        client.getAccount(cneoAccountID),
      ]);
      expect(masterBalance.toNumber()).toEqual(neoAmount.minus(escrowAmount).toNumber());
      expect(toBalance.toNumber()).toEqual(0);
      expect(totalSupply.toNumber()).toEqual(neoAmount.minus(claimAmount).toNumber());
      expect(toAccount.balances[Hash256.NEO].toNumber()).toEqual(claimAmount.toNumber());

      // Claim the accumulated GAS
      await cneo.claim.confirmed();
      const cneoAccountAfter = await client.getAccount(cneoAccountID);
      expect(cneoAccountBefore.balances[Hash256.GAS]).toBeUndefined();
      expect(cneoAccountAfter.balances[Hash256.GAS]).toBeDefined();
      expect(cneoAccountAfter.balances[Hash256.GAS].toNumber()).toBeGreaterThan(0);
    });
  });
});
