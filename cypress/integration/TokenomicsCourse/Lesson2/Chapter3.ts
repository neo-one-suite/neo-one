import { ALL_SLUGS, lesson2, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 2 - Chapter 3', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson2({
    chapter: 3,
    error: 'token.amountPerNEO is not a function',
    problems: [
      {
        owner: 'ts',
        text: "Property 'amountPerNEO' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 30,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'remaining' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 33,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'remaining' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 88,
        endLine: 15,
      },
    ],
  });
});
