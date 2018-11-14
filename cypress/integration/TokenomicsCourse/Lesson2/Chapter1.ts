import { ALL_SLUGS, lesson2, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 2 - Chapter 1', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson2({
    chapter: 1,
    error: "Cannot read property 'confirmed' of undefined",
    skip: true,
    problems: [
      {
        owner: 'ts',
        text: "Property 'mintTokens' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 12,
        endLine: 39,
      },
    ],
  });
});
