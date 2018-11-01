import { ALL_SLUGS, lesson2, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 2 - Chapter 5', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson2({
    chapter: 5,
    error: "Cannot read property 'confirmed' of undefined",
    problems: [
      {
        owner: 'ts',
        text: "Property 'withdraw' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 189,
        endLine: 43,
      },
    ],
  });
});
