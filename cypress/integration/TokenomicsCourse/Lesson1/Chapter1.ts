import { ALL_SLUGS, lesson1, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 1 - Chapter 1', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson1({
    chapter: 1,
    testName: 'deploys',
    error: 'find module',
    problems: [
      {
        owner: 'ts',
        text: "Cannot find module '../generated/test'.",
        startLine: 1,
        endLine: 31,
      },
      {
        owner: 'ts',
        text: "Binding element 'token' implicitly has an 'any' type.",
        startLine: 7,
        endLine: 34,
      },
    ],
  });
});
