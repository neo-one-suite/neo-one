import { ALL_SLUGS, lesson4, prepareCourseTest } from '../../../common';

describe('Tokenomics - Lesson 4 - Chapter 6', () => {
  prepareCourseTest({
    slugs: ALL_SLUGS,
  });

  lesson4({
    chapter: 6,
    error: "Cannot read property 'type' of undefined",
    testName: 'holds funds claimable by two parties',
    contracts: ['Token', 'Escrow'],
    problems: [
      {
        owner: 'ts',
        text: `Argument of type 'string' is not assignable to parameter of type '(TransactionOptions & GetOptions) | undefined'.`,
        startLine: 53,
        endLine: 9,
      },
      {
        owner: 'ts',
        text: 'Expected 2 arguments, but got 3.',
        startLine: 78,
        endLine: 27,
      },
      {
        owner: 'ts',
        text: `Argument of type 'string' is not assignable to parameter of type '(TransactionOptions & GetOptions) | undefined'.`,
        startLine: 86,
        endLine: 9,
      },
      {
        owner: 'ts',
        text: 'Expected 2 arguments, but got 3.',
        startLine: 94,
        endLine: 23,
      },
      {
        owner: 'ts',
        text: 'Expected 3-4 arguments, but got 5.',
        startLine: 99,
        endLine: 34,
      },
      {
        owner: 'ts',
        text: 'Expected 2 arguments, but got 3.',
        startLine: 131,
        endLine: 23,
      },
      {
        owner: 'ts',
        text: 'Expected 3-4 arguments, but got 5.',
        startLine: 135,
        endLine: 40,
      },
      {
        owner: 'ts',
        text: 'Expected 2 arguments, but got 3.',
        startLine: 148,
        endLine: 23,
      },
      {
        owner: 'ts',
        text: `Argument of type 'string' is not assignable to parameter of type '(TransactionOptions & GetOptions) | undefined'.`,
        startLine: 157,
        endLine: 9,
      },
      {
        owner: 'ts',
        text: 'Expected 2 arguments, but got 3.',
        startLine: 182,
        endLine: 23,
      },
      {
        owner: 'ts',
        text: `Argument of type 'string' is not assignable to parameter of type '(TransactionOptions & GetOptions) | undefined'.`,
        startLine: 190,
        endLine: 9,
      },
      {
        owner: 'ts',
        text: 'Expected 3-4 arguments, but got 5.',
        startLine: 200,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: `Argument of type 'string' is not assignable to parameter of type '(TransactionOptions & GetOptions) | undefined'.`,
        startLine: 211,
        endLine: 104,
      },
    ],
  });
});
