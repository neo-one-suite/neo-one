import { ALL_SLUGS, lesson3, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 3 - Chapter 3', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson3({
    chapter: 3,
    error: 'expect(received).toBeDefined()',
    testName: 'handleMint mints tokens',
    problems: [
      {
        owner: 'ts',
        text: "A function whose declared type is neither 'void' nor 'any' must return a value.",
        startLine: 43,
        endLine: 4,
      },
    ],
  });
});
