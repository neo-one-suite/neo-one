import { ALL_SLUGS, lesson3, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 3 - Chapter 1', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson3({
    chapter: 1,
    error: "Cannot destructure property `name` of 'undefined' or 'null'.",
    problems: [
      {
        owner: 'ts',
        text: "A function whose declared type is neither 'void' nor 'any' must return a value.",
        startLine: 14,
        endLine: 64,
      },
    ],
  });
});
