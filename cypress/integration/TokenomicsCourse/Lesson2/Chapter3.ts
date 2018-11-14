import { ALL_SLUGS, lesson2, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 2 - Chapter 3', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson2({
    chapter: 3,
    error: 'expect(received).toHaveLength(length)',
    problems: [
      {
        owner: 'ts',
        text: "Property 'remaining' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 60,
        endLine: 15,
      },
    ],
  });
});
