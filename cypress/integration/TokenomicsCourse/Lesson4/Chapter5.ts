import { ALL_SLUGS, lesson4, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 4 - Chapter 5', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson4({
    chapter: 5,
    error: "Cannot read property 'confirmed' of undefined",
    testName: 'holds funds claimable by two parties',
    problems: [
      {
        owner: 'ts',
        text: "Property 'refund' does not exist on type 'EscrowSmartContract<Client<any, any>>'.",
        startLine: 142,
        endLine: 42,
      },
      {
        owner: 'ts',
        text: "Property 'refund' does not exist on type 'EscrowSmartContract<Client<any, any>>'.",
        startLine: 169,
        endLine: 48,
      },
      {
        owner: 'ts',
        text: "Property 'refund' does not exist on type 'EscrowSmartContract<Client<any, any>>'.",
        startLine: 193,
        endLine: 22,
      },
      {
        owner: 'ts',
        text:
          "This condition will always return 'true' since the types '\"transfer\"' |  '\"approveSendTransfer\"' | '\"revokeSendTransfer\"' | '\"balanceAvailable\"' and '\"balanceRefunded\"' have no overlap.",
        startLine: 157,
        endLine: 11,
      },
      {
        owner: 'ts',
        text: `Property 'to' does not exist on type 'EscrowTransferEventParameters | EscrowApproveSendTransferEventParameters | EscrowRevokeSendTransferEventParameters | EscrowBalanceAvailableEventParameters | EscrowBalanceClaimedEventParameters'. Property 'to' does not exist on type 'EscrowApproveSendTransferEventParameters'.`,
        startLine: 161,
        endLine: 31,
      },
    ],
  });
});
