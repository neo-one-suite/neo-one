import { ALL_SLUGS, lesson4, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 4 - Chapter 4', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson4({
    chapter: 4,
    error: "Cannot read property 'confirmed' of undefined",
    testName: 'holds funds claimable by two parties',
    contracts: ['Token', 'Escrow'],
    problems: [
      {
        owner: 'ts',
        text: "Property 'claim' does not exist on type 'EscrowSmartContract<Client<any, any>>'.",
        startLine: 91,
        endLine: 41,
      },
      {
        owner: 'ts',
        text: `This condition will always return 'true' since the types '"transfer" | "approveSendTransfer" | "revokeSendTransfer" | "balanceAvailable"' and '"balanceClaimed"' have no overlap.`,
        startLine: 113,
        endLine: 11,
      },
      {
        owner: 'ts',
        text: `Property 'to' does not exist on type 'EscrowTransferEventParameters | EscrowApproveSendTransferEventParameters | EscrowRevokeSendTransferEventParameters | EscrowBalanceAvailableEventParameters'.\n  Property 'to' does not exist on type 'EscrowApproveSendTransferEventParameters'.`,
        startLine: 117,
        endLine: 31,
      },
      {
        owner: 'ts',
        text: "Property 'claim' does not exist on type 'EscrowSmartContract<Client<any, any>>'.",
        startLine: 125,
        endLine: 47,
      },
      {
        owner: 'ts',
        text: "Property 'claim' does not exist on type 'EscrowSmartContract<Client<any, any>>'.",
        startLine: 143,
        endLine: 22,
      },
    ],
  });
});
