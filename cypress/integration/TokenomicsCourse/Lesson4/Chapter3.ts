import { ALL_SLUGS, lesson4, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 4 - Chapter 3', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson4({
    chapter: 3,
    error: 'expect(received).toEqual(expected)',
    problems: [
      {
        owner: 'ts',
        text:
          "This condition will always return 'true' since the types '\"balanceAvailable\"' and '\"transfer\"' have no overlap.",
        startLine: 65,
        endLine: 11,
      },
    ],
  });
});
