import { ALL_SLUGS, lesson1, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 1 - Chapter 6', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson1({
    chapter: 6,
    error: "Cannot read property 'confirmed' of undefined",
    problems: [
      {
        owner: 'ts',
        text: "Property 'issue' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 33,
        endLine: 40,
      },
      {
        owner: 'ts',
        text: "Property 'issue' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 47,
        endLine: 46,
      },
    ],
  });
});
