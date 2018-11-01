// tslint:disable no-object-literal-type-assertion
import { build, checkProblems, enterSolution, nextButton, prepareCourseTest, Problem, runTests, Test } from '../common';

describe('Tokenomics', () => {
  beforeEach(() => {
    prepareCourseTest({
      slugs: [
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
      ],
    });
  });

  it('lesson 1 chapter 1', () => {
    cy.visit('/course');

    cy.get('[data-test=tokenomics-lesson-0]').click();
    cy.get('[data-test=start]').click();

    build({ success: false });
    runTests({
      passing: 0,
      failing: 1,
      suites: [
        {
          basename: 'Token.test.ts',
          dirname: 'one/tests',
          passing: 0,
          failing: 1,
          error: 'find module',
          tests: [],
        },
      ],
    });
    checkProblems([
      {
        path: '/one/tests/Token.test.ts',
        problems: [
          {
            owner: 'ts',
            text: "Cannot find module '../generated/test'.",
            startLine: 1,
            endLine: 31,
          },
          {
            owner: 'ts',
            text: "Binding element 'token' implicitly has an 'any' type.",
            startLine: 7,
            endLine: 34,
          },
        ],
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
              name: ['Token', 'deploys'],
              state: 'pass',
            },
          ],
        },
      ],
    });
  });

  const lesson1 = ({
    error,
    chapter,
    problems,
    testName = 'has NEP-5 properties and methods',
  }: {
    error: string;
    chapter: number;
    problems: ReadonlyArray<Problem>;
    testName?: string;
  }) => {
    it(`Lesson 1 Chapter ${chapter}`, () => {
      cy.visit('/course');

      cy.get('[data-test=tokenomics-lesson-0]').click();
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

  lesson1({
    chapter: 2,
    testName: 'has name, symbol and decimals properties',
    error: 'token.name is not a function',
    problems: [
      {
        owner: 'ts',
        text: "Property 'name' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 10,
        endLine: 65,
      },
      {
        owner: 'ts',
        text: "Property 'symbol' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 10,
        endLine: 79,
      },
      {
        owner: 'ts',
        text: "Property 'decimals' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 10,
        endLine: 95,
      },
    ],
  });
  lesson1({
    chapter: 3,
    testName: 'has name, symbol, decimals and totalSupply properties',
    error: 'token.totalSupply is not a function',
    problems: [
      {
        owner: 'ts',
        text: "Property 'totalSupply' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 14,
        endLine: 15,
      },
    ],
  });
  lesson1({
    chapter: 4,
    error: 'token.balanceOf is not a function',
    problems: [
      {
        owner: 'ts',
        text: "Property 'balanceOf' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 21,
        endLine: 15,
      },
    ],
  });
  lesson1({
    chapter: 5,
    error: 'token.owner is not a function',
    problems: [
      {
        owner: 'ts',
        text: "Property 'owner' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 22,
        endLine: 15,
      },
    ],
  });
  lesson1({
    chapter: 6,
    error: "Cannot read property 'confirmed' of undefined",
    problems: [
      {
        owner: 'ts',
        text: "Property 'issue' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 33,
        endLine: 40,
      },
      {
        owner: 'ts',
        text: "Property 'issue' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 47,
        endLine: 46,
      },
    ],
  });
  lesson1({
    chapter: 7,
    error: 'expect(received).toHaveLength(length)',
    problems: [
      {
        owner: 'ts',
        text: "Property 'name' does not exist on type 'never'.",
        startLine: 40,
        endLine: 20,
      },
      {
        owner: 'ts',
        text: "Property 'name' does not exist on type 'never'.",
        startLine: 41,
        endLine: 17,
      },
      {
        owner: 'ts',
        text: "Property 'parameters' does not exist on type 'never'.",
        startLine: 44,
        endLine: 20,
      },
      {
        owner: 'ts',
        text: "Property 'parameters' does not exist on type 'never'.",
        startLine: 45,
        endLine: 20,
      },
      {
        owner: 'ts',
        text: "Property 'parameters' does not exist on type 'never'.",
        startLine: 46,
        endLine: 20,
      },
    ],
  });
  lesson1({
    chapter: 8,
    error: "Cannot read property 'confirmed' of undefined",
    problems: [
      {
        owner: 'ts',
        text: "Property 'transfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 65,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'transfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 69,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'transfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 71,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'transfer' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 109,
        endLine: 21,
      },
    ],
  });

  const lesson2 = ({
    chapter,
    error,
    problems = [],
    testName = 'allows minting tokens',
    skip = false,
  }: {
    chapter: number;
    error: string;
    problems?: ReadonlyArray<Problem>;
    testName?: string;
    skip?: boolean;
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

  lesson2({
    chapter: 1,
    error: "Cannot read property 'confirmed' of undefined",
    skip: true,
    problems: [
      {
        owner: 'ts',
        text: "Property 'mintTokens' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 12,
        endLine: 39,
      },
    ],
  });
  lesson2({
    chapter: 2,
    error: 'expect(received).toBeDefined()',
    skip: true,
  });
  lesson2({
    chapter: 3,
    error: 'token.amountPerNEO is not a function',
    problems: [
      {
        owner: 'ts',
        text: "Property 'amountPerNEO' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 30,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'remaining' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 33,
        endLine: 15,
      },
      {
        owner: 'ts',
        text: "Property 'remaining' does not exist on type 'TokenSmartContract<Client<any, any>>'.",
        startLine: 88,
        endLine: 15,
      },
    ],
  });
  lesson2({ chapter: 4, error: 'expect(received).toBeDefined()' });
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
