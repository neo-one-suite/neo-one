import { ALL_SLUGS, lesson4, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 4 - Chapter 7', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson4({
    chapter: 7,
    error: "Cannot read property 'name' of undefined",
    testName: 'can wrap and unwrap NEO and be used as a NEP-5 token',
    fileName: 'CNEO',
    contracts: ['CNEO', 'Escrow', 'Token'],
    problems: [],
  });
});
