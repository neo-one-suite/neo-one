import { ALL_SLUGS, lesson3, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 3 - Chapter 5', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson3({
    chapter: 5,
    error: "Cannot read property 'result' of undefined",
    testName: 'handleMint mints tokens, createTokenInfoStream$ reacts to the mint, handleTransfer transfers tokens',
    problems: [
      {
        owner: 'ts',
        text: "A function whose declared type is neither 'void' nor 'any' must return a value.",
        startLine: 70,
        endLine: 4,
      },
    ],
  });
});
