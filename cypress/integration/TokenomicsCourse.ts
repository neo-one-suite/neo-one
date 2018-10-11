import { build, checkProblems, enterSolution, nextButton, prepareCourseTest, runTests } from '../common';

describe('Tokenomics', () => {
  it('works e2e', () => {
    cy.visit('/course');

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
      ],
    });

    cy.get('[data-test=tokenomics-lesson-0]').click();
    cy.get('[data-test=start]').click();

    // Lesson 1: Chapter 1
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
          error: "Error: Cannot find module '../generated/test' from '/one/tests'",
          tests: [],
        },
      ],
    });
    checkProblems([
      {
        path: 'one/tests/Token.test.ts',
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
    // Check problems cleared
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

    const lesson1 = ({
      error,
      testName = 'has NEP-5 properties and methods',
    }: {
      error: string;
      testName?: string;
    }) => {
      nextButton();
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
      // Check for Problems
      enterSolution({ path: 'one/contracts/Token.one.ts' });
      build({ success: true });
      // Check problems cleared
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
    };

    // Lesson 1: Chapter 2
    lesson1({ testName: 'has name, symbol and decimals properties', error: 'TypeError: token.name is not a function' });

    // Lesson 1: Chapter 3
    lesson1({
      testName: 'has name, symbol, decimals and totalSupply properties',
      error: 'TypeError: token.totalSupply is not a function',
    });

    // Lesson 1: Chapter 4
    lesson1({ error: 'TypeError: token.balanceOf is not a function' });

    // Lesson 1: Chapter 5
    lesson1({ error: 'TypeError: token.owner is not a function' });

    // Lesson 1: Chapter 6
    lesson1({ error: "TypeError: Cannot read property 'confirmed' of undefined" });

    // Lesson 1: Chapter 7
    lesson1({ error: 'Error: expect(received).toHaveLength(length)' });

    // Lesson 1: Chapter 8
    lesson1({ error: "TypeError: Cannot read property 'confirmed' of undefined" });

    const lesson2 = ({
      error,
      testName = 'has NEP-5 properties and methods',
    }: {
      error: string;
      testName?: string;
    }) => {
      nextButton();
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
              {
                name: ['Token', 'has NEP-5 properties and methods'],
                state: 'skip',
              },
            ],
          },
        ],
      });
      // Check for Problems
      enterSolution({ path: 'one/contracts/Token.one.ts' });
      build({ success: true });
      // Check problems cleared
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
              {
                name: ['Token', 'has NEP-5 properties and methods'],
                state: 'skip',
              },
            ],
          },
        ],
      });
    };

    // Lesson 2: Chapter 1
    lesson2({ error: "TypeError: Cannot read property 'confirmed' of undefined" });

    // Lesson 2: Chapter 2
    lesson2({ error: 'Error: expect(received).toBeDefined()' });
  });
});
