import { ALL_SLUGS, lesson1, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 1 - Chapter 3', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson1({
    chapter: 3,
    testName: 'has name, symbol, decimals and totalSupply properties',
    error: 'token.totalSupply is not a function',
    problems: [
      {
        owner: 'ts',
        text: "Property 'totalSupply' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 14,
        endLine: 15,
      },
    ],
  });
});
