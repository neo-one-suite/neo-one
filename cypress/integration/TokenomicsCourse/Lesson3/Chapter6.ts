import { ALL_SLUGS, lesson3, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 3 - Chapter 6', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson3({
    chapter: 6,
    error: `expect(received).toBeUndefined()`,
    testName:
      'handleMint mints tokens, createTokenInfoStream$ reacts to the mint, handleTransfer transfers tokens and handleWithdraw withdraws contributions',
  });
});
