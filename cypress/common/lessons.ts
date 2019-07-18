// tslint:disable no-object-literal-type-assertion
import { build, checkProblems, enterSolution, resetEditorTab, nextButton, Problem, runTests, Test } from './matchers';

export const ALL_SLUGS: readonly string[] = [
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
  '/course/tokenomics/3/1',
  '/course/tokenomics/3/2',
  '/course/tokenomics/3/3',
  '/course/tokenomics/3/4',
  '/course/tokenomics/3/5',
  '/course/tokenomics/3/6',
  '/course/tokenomics/4/1',
  '/course/tokenomics/4/2',
  '/course/tokenomics/4/3',
  '/course/tokenomics/4/4',
  '/course/tokenomics/4/5',
  '/course/tokenomics/4/6',
  '/course/tokenomics/4/7',
  '/course/tokenomics/4/8',
];

export const lesson1 = ({
  error,
  chapter,
  problems,
  testName = 'has NEP-5 properties and methods',
}: {
  readonly error: string;
  readonly chapter: number;
  readonly problems: readonly Problem[];
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

    cy.reload(true);
    build({ success: chapter === 1 ? false : true, contracts: ['Token'] });
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
    build({ success: true, contracts: ['Token'] });
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
  readonly problems?: readonly Problem[];
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

    cy.reload(true);
    build({ success: true, contracts: ['Token'] });
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
    build({ success: true, contracts: ['Token'] });
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

export const lesson3 = ({
  chapter,
  problems = [],
  error,
  testName,
}: {
  readonly chapter: number;
  readonly problems?: readonly Problem[];
  readonly error: string;
  readonly testName?: string;
}) => {
  it(`Lesson 3 Chapter ${chapter}`, () => {
    const baseTestName = 'getTokenInfo returns token info';

    cy.visit('/course');

    cy.get('[data-test=tokenomics-lesson-2]').click();
    cy.get('[data-test=start]').click();

    // tslint:disable-next-line no-loop-statement
    for (let i = 0; i < chapter - 1; i += 1) {
      nextButton();
    }

    cy.reload(true);
    build({ success: true, contracts: ['Token'] });
    runTests({
      passing: 0,
      failing: 1,
      suites: [
        {
          basename: 'utils.test.ts',
          dirname: 'src/__tests__',
          passing: testName === undefined ? 0 : 1,
          failing: 1,
          tests:
            testName === undefined
              ? [
                  {
                    name: ['utils', baseTestName],
                    state: 'fail',
                    error,
                  },
                ]
              : [
                  {
                    name: ['utils', baseTestName],
                    state: 'pass',
                  },
                  {
                    name: ['utils', testName],
                    state: 'fail',
                    error,
                  },
                ],
        },
      ],
    });
    checkProblems([
      {
        path: '/src/utils.ts',
        problems,
      },
    ]);
    enterSolution({ path: 'src/utils.ts' });
    if (chapter === 6) {
      enterSolution({ path: 'src/ICO.tsx' });
    }
    build({ success: true, contracts: ['Token'] });
    checkProblems([
      {
        path: '/src/utils.ts',
        problems: [],
      },
    ]);
    resetEditorTab({ path: `src/__tests__/utils.test.ts` });
    runTests({
      passing: 1,
      failing: 0,
      suites: [
        {
          basename: 'utils.test.ts',
          dirname: 'src/__tests__',
          passing: chapter === 3 || chapter === 4 || chapter === 5 || chapter === 6 ? 2 : 1,
          failing: 0,
          tests: [
            {
              name: ['utils', baseTestName],
              state: 'pass',
            } as Test,
          ].concat(
            testName === undefined
              ? []
              : [
                  {
                    name: ['utils', testName],
                    state: 'pass',
                  } as Test,
                ],
          ),
        },
      ],
    });
  });
};

export const lesson4 = ({
  error,
  chapter,
  problems,
  contracts,
  secondContracts,
  testName = 'can deposit funds',
  fileName = 'Escrow',
}: {
  readonly error: string;
  readonly chapter: number;
  readonly problems: readonly Problem[];
  readonly contracts: readonly string[];
  readonly secondContracts?: readonly string[];
  readonly testName?: string;
  readonly fileName?: string;
}) => {
  it(`Lesson 4 Chapter ${chapter}`, () => {
    Cypress.on('uncaught:exception', (_err, _runnable) => false);
    cy.visit('/course');

    cy.get('[data-test=tokenomics-lesson-3]').click();
    cy.get('[data-test=start]').click();

    // tslint:disable-next-line no-loop-statement
    for (let i = 0; i < chapter - 1; i += 1) {
      nextButton();
    }

    cy.reload(true);
    build({ success: true, contracts });
    runTests({
      passing: 0,
      failing: 1,
      suites: [
        {
          basename: `${fileName}.test.ts`,
          dirname: 'one/tests',
          passing: 0,
          failing: 1,
          tests: [
            {
              name: [fileName, testName],
              state: 'fail',
              error,
            },
          ],
        },
      ],
    });
    checkProblems([
      {
        path: `/one/tests/${fileName}.test.ts`,
        problems,
      },
    ]);
    enterSolution({ path: `one/contracts/${fileName}.one.ts` });
    if (chapter === 3 || chapter === 8) {
      enterSolution({ path: `one/contracts/Token.one.ts` });
      resetEditorTab({ path: `one/contracts/${fileName}.one.ts` });
    }
    build({ success: true, contracts: secondContracts === undefined ? contracts : secondContracts });
    checkProblems([
      {
        path: `/one/tests/${fileName}.test.ts`,
        problems: [],
      },
    ]);
    runTests({
      passing: 1,
      failing: 0,
      suites: [
        {
          basename: `${fileName}.test.ts`,
          dirname: 'one/tests',
          passing: 1,
          failing: 0,
          tests: [
            {
              name: [fileName, testName],
              state: 'pass',
            },
          ],
        },
      ],
    });
  });
};
