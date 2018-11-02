import { ALL_SLUGS, lesson4, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 4 - Chapter 8', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson4({
    chapter: 8,
    error: 'escrow.forwardApproveReceiveTransferArgs is not a function',
    testName: 'holds funds claimable by two parties',
    contracts: ['Escrow', 'Token'],
    problems: [
      {
        owner: 'ts',
        text: `Property 'forwardApproveReceiveTransferArgs' does not exist on type 'EscrowSmartContract<Client<any, any>>'.`,
        startLine: 40,
        endLine: 19,
      },
      {
        owner: 'ts',
        text: `This condition will always return 'true' since the types '"transfer" | "approveSendTransfer" | "revokeSendTransfer"' and '"balanceAvailable"' have no overlap.`,
        startLine: 48,
        endLine: 11,
      },
      {
        owner: 'ts',
        text: `Property 'to' does not exist on type 'TokenTransferEventParameters | TokenApproveSendTransferEventParameters | TokenRevokeSendTransferEventParameters'.\n  Property 'to' does not exist on type 'TokenApproveSendTransferEventParameters'.`,
        startLine: 52,
        endLine: 31,
      },
      {
        owner: 'ts',
        text: `Property 'asset' does not exist on type 'TokenTransferEventParameters | TokenApproveSendTransferEventParameters | TokenRevokeSendTransferEventParameters'.\n  Property 'asset' does not exist on type 'TokenTransferEventParameters'.`,
        startLine: 55,
        endLine: 31,
      },
      {
        owner: 'ts',
        text: `Type 'EscrowEvent' is not assignable to type 'TokenEvent'.\n  Type 'EscrowBalanceAvailableEvent' is not assignable to type 'TokenEvent'.\n    Type 'EscrowBalanceAvailableEvent' is not assignable to type 'TokenRevokeSendTransferEvent'.\n      Types of property 'name' are incompatible.\n        Type '"balanceAvailable"' is not assignable to type '"revokeSendTransfer"'.`,
        startLine: 84,
        endLine: 7,
      },
      {
        owner: 'ts',
        text: `Type 'EscrowEvent' is not assignable to type 'TokenEvent'.\n  Type 'EscrowBalanceAvailableEvent' is not assignable to type 'TokenEvent'.\n    Type 'EscrowBalanceAvailableEvent' is not assignable to type 'TokenRevokeSendTransferEvent'.`,
        startLine: 92,
        endLine: 7,
      },
      {
        owner: 'ts',
        text: `This condition will always return 'true' since the types '"transfer" | "approveSendTransfer" | "revokeSendTransfer"' and '"balanceClaimed"' have no overlap.`,
        startLine: 94,
        endLine: 11,
      },
      {
        owner: 'ts',
        text: `Property 'to' does not exist on type 'TokenTransferEventParameters | TokenApproveSendTransferEventParameters | TokenRevokeSendTransferEventParameters'.\n  Property 'to' does not exist on type 'TokenApproveSendTransferEventParameters'.`,
        startLine: 98,
        endLine: 31,
      },
      {
        owner: 'ts',
        text: `Property 'asset' does not exist on type 'TokenTransferEventParameters | TokenApproveSendTransferEventParameters | TokenRevokeSendTransferEventParameters'.\n  Property 'asset' does not exist on type 'TokenTransferEventParameters'.`,
        startLine: 100,
        endLine: 31,
      },
      {
        owner: 'ts',
        text: `Type 'EscrowEvent' is not assignable to type 'TokenEvent'.\n  Type 'EscrowBalanceAvailableEvent' is not assignable to type 'TokenEvent'.\n    Type 'EscrowBalanceAvailableEvent' is not assignable to type 'TokenRevokeSendTransferEvent'.`,
        startLine: 135,
        endLine: 7,
      },
      {
        owner: 'ts',
        text: `Type 'EscrowEvent' is not assignable to type 'TokenEvent'.\n  Type 'EscrowBalanceAvailableEvent' is not assignable to type 'TokenEvent'.\n    Type 'EscrowBalanceAvailableEvent' is not assignable to type 'TokenRevokeSendTransferEvent'.`,
        startLine: 143,
        endLine: 7,
      },
      {
        owner: 'ts',
        text: `This condition will always return 'true' since the types '"transfer" | "approveSendTransfer" | "revokeSendTransfer"' and '"balanceRefunded"' have no overlap.`,
        startLine: 145,
        endLine: 11,
      },
      {
        owner: 'ts',
        text: `Property 'to' does not exist on type 'TokenTransferEventParameters | TokenApproveSendTransferEventParameters | TokenRevokeSendTransferEventParameters'.\n  Property 'to' does not exist on type 'TokenApproveSendTransferEventParameters'.`,
        startLine: 149,
        endLine: 31,
      },
      {
        owner: 'ts',
        text: `Property 'asset' does not exist on type 'TokenTransferEventParameters | TokenApproveSendTransferEventParameters | TokenRevokeSendTransferEventParameters'.\n  Property 'asset' does not exist on type 'TokenTransferEventParameters'.`,
        startLine: 151,
        endLine: 31,
      },
    ],
  });
});
