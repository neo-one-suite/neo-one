// tslint:disable no-object-literal-type-assertion
import { build, checkProblems, enterSolution, nextButton, Problem, runTests, Test } from './matchers';

export const ALL_SLUGS: ReadonlyArray<string> = [
  '/course/tokenomics/1/1',
  '/course/tokenomics/1/2',
  '/course/tokenomics/1/3',
  '/course/tokenomics/1/4',
  '/course/tokenomics/1/5',
  '/course/tokenomics/1/6',
  '/course/tokenomics/1/7',
  '/course/tokenomics/1/8',
  '/course/tokenomics/2/1',
  '/course/tokenomics/2/2',
  '/course/tokenomics/2/3',
  '/course/tokenomics/2/4',
  '/course/tokenomics/2/5',
];

export const lesson1 = ({
  error,
  chapter,
  problems,
  testName = 'has NEP-5 properties and methods',
}: {
  readonly error: string;
  readonly chapter: number;
  readonly problems: ReadonlyArray<Problem>;
  readonly testName?: string;
}) => {
  it(`Lesson 1 Chapter ${chapter}`, () => {
    cy.visit('/course');

    cy.get('[data-test=tokenomics-lesson-0]').click();
    cy.get('[data-test=start]').click();

    // tslint:disable-next-line no-loop-statement
    for (let i = 0; i < chapter - 1; i += 1) {
      nextButton();
    }

    build({ success: chapter === 1 ? false : true });
    runTests({
      passing: 0,
      failing: 1,
      suites: [
        {
          basename: 'Token.test.ts',
          dirname: 'one/tests',
          passing: 0,
          failing: 1,
          error: chapter === 1 ? error : undefined,
          tests:
            chapter === 1
              ? []
              : [
                  {
                    name: ['Token', testName],
                    state: 'fail',
                    error,
                  },
                ],
        },
      ],
    });
    checkProblems([
      {
        path: '/one/tests/Token.test.ts',
        problems,
      },
    ]);
    enterSolution({ path: 'one/contracts/Token.one.ts' });
    build({ success: true });
    checkProblems([
      {
        path: '/one/tests/Token.test.ts',
        problems: [],
      },
    ]);
    runTests({
      passing: 1,
      failing: 0,
      suites: [
        {
          basename: 'Token.test.ts',
          dirname: 'one/tests',
          passing: 1,
          failing: 0,
          tests: [
            {
              name: ['Token', testName],
              state: 'pass',
            },
          ],
        },
      ],
    });
  });
};

export const lesson2 = ({
  chapter,
  error,
  problems = [],
  testName = 'allows minting tokens',
  skip = false,
}: {
  readonly chapter: number;
  readonly error: string;
  readonly problems?: ReadonlyArray<Problem>;
  readonly testName?: string;
  readonly skip?: boolean;
}) => {
  it(`Lesson 2 Chapter ${chapter}`, () => {
    cy.visit('/course');

    cy.get('[data-test=tokenomics-lesson-1]').click();
    cy.get('[data-test=start]').click();

    // tslint:disable-next-line no-loop-statement
    for (let i = 0; i < chapter - 1; i += 1) {
      nextButton();
    }

    build({ success: true });
    runTests({
      passing: 0,
      failing: 1,
      suites: [
        {
          basename: 'Token.test.ts',
          dirname: 'one/tests',
          passing: 0,
          failing: 1,
          tests: [
            {
              name: ['Token', testName],
              state: 'fail',
              error,
            } as Test,
          ].concat(
            skip
              ? [
                  {
                    name: ['Token', 'has NEP-5 properties and methods'],
                    state: 'skip',
                  } as Test,
                ]
              : [],
          ),
        },
      ],
    });
    checkProblems([
      {
        path: '/one/tests/Token.test.ts',
        problems,
      },
    ]);
    enterSolution({ path: 'one/contracts/Token.one.ts' });
    build({ success: true });
    checkProblems([
      {
        path: '/one/tests/Token.test.ts',
        problems: [],
      },
    ]);
    runTests({
      passing: 1,
      failing: 0,
      suites: [
        {
          basename: 'Token.test.ts',
          dirname: 'one/tests',
          passing: 1,
          failing: 0,
          tests: [
            {
              name: ['Token', testName],
              state: 'pass',
            } as Test,
          ].concat(
            skip
              ? [
                  {
                    name: ['Token', 'has NEP-5 properties and methods'],
                    state: 'skip' as 'skip',
                  } as Test,
                ]
              : [],
          ),
        },
      ],
    });
  });
};
