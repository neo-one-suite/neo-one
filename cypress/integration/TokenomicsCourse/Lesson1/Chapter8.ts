import { ALL_SLUGS, lesson1, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 1 - Chapter 8', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson1({
    chapter: 8,
    error: "Cannot read property 'confirmed' of undefined",
    problems: [
      {
        owner: 'ts',
        text: "Property 'transfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 71,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'transfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 75,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'transfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 77,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'transfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 119,
        endLine: 21,
      },
    ],
  });
});
