import { build, checkProblems, enterSolution, nextButton, prepareCourseTest, runTests } from '../common';

describe('Tokenomics', () => {
  it('works e2e', () => {
    cy.visit('/course');

    prepareCourseTest({
      slugs: ['/course/tokenomics/1/1', '/course/tokenomics/1/2'],
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
    enterSolution({ path: 'one/contracts/Token.one.ts', skipBackspace: true });
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
    nextButton();

    // Lesson 1: Chapter 2
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
              name: ['Token', 'has name, symbol and decimals properties'],
              state: 'fail',
              error: 'TypeError: token.name is not a function',
            },
          ],
        },
      ],
    });
    // Check for Problems
    enterSolution({ path: 'one/contracts/Token.one.ts' });
    build({ success: true });
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
              name: ['Token', 'has name, symbol and decimals properties'],
              state: 'pass',
            },
          ],
        },
      ],
    });
  });
});
