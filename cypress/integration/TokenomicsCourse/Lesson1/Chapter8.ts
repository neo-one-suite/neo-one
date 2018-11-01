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
        startLine: 65,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'transfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 69,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'transfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 71,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'transfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 109,
        endLine: 21,
      },
    ],
  });
});
