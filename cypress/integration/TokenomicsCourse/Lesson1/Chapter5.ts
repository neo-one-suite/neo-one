import { ALL_SLUGS, lesson1, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 1 - Chapter 5', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson1({
    chapter: 5,
    error: 'token.owner is not a function',
    problems: [
      {
        owner: 'ts',
        text: "Property 'owner' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 22,
        endLine: 15,
      },
    ],
  });
});
