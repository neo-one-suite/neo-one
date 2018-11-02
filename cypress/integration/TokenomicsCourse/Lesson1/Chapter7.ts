import { ALL_SLUGS, lesson1, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 1 - Chapter 7', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson1({
    chapter: 7,
    error: 'expect(received).toHaveLength(length)',
    problems: [
      {
        owner: 'ts',
        text: "Property 'name' does not exist on type 'never'.",
        startLine: 42,
        endLine: 20,
      },
      {
        owner: 'ts',
        text: "Property 'name' does not exist on type 'never'.",
        startLine: 43,
        endLine: 17,
      },
      {
        owner: 'ts',
        text: "Property 'parameters' does not exist on type 'never'.",
        startLine: 46,
        endLine: 20,
      },
      {
        owner: 'ts',
        text: "Property 'parameters' does not exist on type 'never'.",
        startLine: 47,
        endLine: 20,
      },
      {
        owner: 'ts',
        text: "Property 'parameters' does not exist on type 'never'.",
        startLine: 48,
        endLine: 20,
      },
    ],
  });
});
