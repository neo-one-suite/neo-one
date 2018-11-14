import { ALL_SLUGS, lesson4, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 4 - Chapter 1', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson4({
    chapter: 1,
    error: "Cannot read property 'confirmed' of undefined",
    fileName: 'Token',
    testName: 'can pre-approve and revoke transfers',
    contracts: ['Token'],
    problems: [
      {
        owner: 'ts',
        text: "Property 'approveSendTransfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 14,
        endLine: 42,
      },
      {
        owner: 'ts',
        text: "Property 'approvedTransfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 35,
        endLine: 40,
      },
      {
        owner: 'ts',
        text: "Property 'revokeSendTransfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 40,
        endLine: 41,
      },
      {
        owner: 'ts',
        text: "Property 'approvedTransfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 61,
        endLine: 36,
      },
    ],
  });
});
