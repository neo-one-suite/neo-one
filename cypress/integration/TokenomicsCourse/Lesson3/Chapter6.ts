import { ALL_SLUGS, lesson3, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 3 - Chapter 6', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson3({
    chapter: 6,
    error: "Cannot read property '0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b' of undefined",
    testName:
      'handleMint mints tokens, createTokenInfoStream$ reacts to the mint, handleTransfer transfers tokens and handleWithdraw withdraws contributions',
  });
});
