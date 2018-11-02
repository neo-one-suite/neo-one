import { ALL_SLUGS, lesson4, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 4 - Chapter 4', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson4({
    chapter: 4,
    error: "Cannot read property 'confirmed' of undefined",
    problems: [
      {
        owner: 'ts',
        text: "Property 'claim' does not exist on type 'EscrowSmartContract<Client<any, any>>'.",
        startLine: 98,
        endLine: 41,
      },
      {
        owner: 'ts',
        text: "Property 'claim' does not exist on type 'EscrowSmartContract<Client<any, any>>'.",
        startLine: 129,
        endLine: 47,
      },
      {
        owner: 'ts',
        text: "Property 'claim' does not exist on type 'EscrowSmartContract<Client<any, any>>'.",
        startLine: 145,
        endLine: 22,
      },
      {
        owner: 'ts',
        text:
          "This condition will always return 'true' since the types '\"transfer\"' |  '\"approveSendTransfer\"' | '\"approveSendTransfer\"' | '\"balanceAvailable\"' and '\"balanceClaimed\"' have no overlap.",
        startLine: 119,
        endLine: 11,
      },
      {
        owner: 'ts',
        text:
          "Property 'to' does not exist on type 'EscrowTransferEventParameters' | 'EscrowApproveSendTransferEventParameters' | 'EscrowRevokeSendTransferEventParameters' | 'EscrowBalanceAvailableEventParameters'. Property 'to' does not exist on type 'EscrowApproveSendTransferEventParameters'.",
        startLine: 123,
        endLine: 31,
      },
    ],
  });
});
