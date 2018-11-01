import { ALL_SLUGS, lesson1, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 1 - Chapter 4', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson1({
    chapter: 4,
    error: 'token.balanceOf is not a function',
    problems: [
      {
        owner: 'ts',
        text: "Property 'balanceOf' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 21,
        endLine: 15,
      },
    ],
  });
});
