import { ALL_SLUGS, lesson2, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 2 - Chapter 4', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson2({ chapter: 4, error: 'expect(received).toBeDefined()' });
});
