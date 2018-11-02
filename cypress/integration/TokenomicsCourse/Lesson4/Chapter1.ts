import { ALL_SLUGS, lesson4, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 4 - Chapter 1', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson4({
    chapter: 1,
    error: "Cannot read property 'confirmed' of undefined",
    skip: true,
    fileName: 'Token',
    testName: 'can pre-approve and revoke transfers',
    problems: [
      {
        owner: 'ts',
        text: "Property 'approveSendTransfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 12,
        endLine: 42,
      },
      {
        owner: 'ts',
        text: "Property 'approvedTransfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 32,
        endLine: 40,
      },
      {
        owner: 'ts',
        text: "Property 'revokeSendTransfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 36,
        endLine: 41,
      },
      {
        owner: 'ts',
        text: "Property 'approvedTransfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 56,
        endLine: 36,
      },
    ],
  });
});
