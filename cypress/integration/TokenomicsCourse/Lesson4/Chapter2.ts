import { ALL_SLUGS, lesson4, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 4 - Chapter 2', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson4({
    chapter: 2,
    error: 'expect(received).toBeDefined()',
    contracts: ['Token'],
    secondContracts: ['Escrow', 'Token'],
    problems: [
      {
        owner: 'ts',
        text: "Property 'escrow' does not exist on type 'Contracts & TestOptions'.",
        startLine: 9,
        endLine: 41,
      },
    ],
  });
});
