import { ALL_SLUGS, lesson2, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 2 - Chapter 2', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson2({
    chapter: 2,
    error: 'expect(received).toBeDefined()',
  });
});
