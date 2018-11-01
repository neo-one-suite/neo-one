import { ALL_SLUGS, lesson1, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 1 - Chapter 2', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson1({
    chapter: 2,
    testName: 'has name, symbol and decimals properties',
    error: 'token.name is not a function',
    problems: [
      {
        owner: 'ts',
        text: "Property 'name' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 10,
        endLine: 65,
      },
      {
        owner: 'ts',
        text: "Property 'symbol' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 10,
        endLine: 79,
      },
      {
        owner: 'ts',
        text: "Property 'decimals' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 10,
        endLine: 95,
      },
    ],
  });
});
