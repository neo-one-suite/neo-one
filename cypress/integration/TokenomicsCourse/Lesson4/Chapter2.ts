import { ALL_SLUGS, lesson4, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 4 - Chapter 2', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson4({
    chapter: 2,
    error: 'expect(received).toBeDefined()',
    problems: [
      {
        owner: 'ts',
        text: "Type 'Contract & TestOptions' has no property 'escrow' and no string index signature.",
        startLine: 9,
        endLine: 41,
      },
    ],
  });
});
