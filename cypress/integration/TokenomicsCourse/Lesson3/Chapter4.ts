import { ALL_SLUGS, lesson3, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 3 - Chapter 4', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson3({
    chapter: 4,
    error: "Cannot read property 'pipe' of undefined",
    testName: 'handleMint mints tokens and createTokenInfoStream$ reacts to the mint',
    problems: [
      {
        owner: 'ts',
        text: "A function whose declared type is neither 'void' nor 'any' must return a value.",
        startLine: 57,
        endLine: 84,
      },
    ],
  });
});
