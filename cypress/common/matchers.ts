export interface ProblemRoot {
  readonly path: string;
  readonly problems: ReadonlyArray<Problem>;
}
export interface Problem {
  readonly error?: boolean;
  readonly owner: string;
  readonly text: string;
  readonly startLine: number;
  readonly endLine: number;
}

export const checkProblems = (problemRoots: ReadonlyArray<ProblemRoot>) => {
  const problems = problemRoots.reduce(
    (acc, root) => root.problems.reduce((innerAcc, { error = true }) => (error ? innerAcc + 1 : innerAcc), acc),
    0,
  );
  const warnings = problemRoots.reduce(
    (acc, root) => root.problems.reduce((innerAcc, { error = true }) => (error ? innerAcc : innerAcc + 1), acc),
    0,
  );
  cy.get('[data-test=problems-problem-count]', { timeout: 30000 }).should('have.text', `${problems}`);
  cy.get('[data-test=problems-warning-count]', { timeout: 30000 }).should('have.text', `${warnings}`);
  cy.get('[data-test=problems]').click();
  cy.get('[data-test=console-header-problem-count]').should('have.text', `${problems + warnings}`);
  problemRoots.forEach((problemRoot) => {
    checkProblemRoot(problemRoot);
  });
  cy.get('[data-test=console-close]').click();
};

const checkProblemRoot = ({ path, problems }: ProblemRoot) => {
  cy.get(`[data-test="problem-root-${path}-count"]`, { timeout: 20000 }).should('have.text', `${problems.length}`);
  cy.get(`button[data-test="problem-root-${path}"] > [data-test="problem-root-${path}"]`).click();
  problems.forEach((problem, index) => {
    checkProblem({ ...problem, path, child: index + 1 });
  });
};

const checkProblem = ({
  path,
  child,
  error = true,
  owner,
  text,
  startLine,
  endLine,
}: Problem & { readonly path: string; readonly child: number }) => {
  cy.get(
    `:nth-child(${child}) > [data-test="problem-${path}"] > [data-test="problem-${path}-${
      error ? 'error' : 'warning'
    }"]`,
  ).should('exist');
  cy.get(`:nth-child(${child}) > [data-test="problem-${path}"] > [data-test="problem-${path}-owner"]`).should(
    'have.text',
    `[${owner}]`,
  );
  cy.get(`:nth-child(${child}) > [data-test="problem-${path}"] > [data-test="problem-${path}-message"]`).should(
    'have.text',
    text,
  );
  cy.get(`:nth-child(${child}) > [data-test="problem-${path}"] > [data-test="problem-${path}-line"]`).should(
    'have.text',
    `(${startLine}, ${endLine})`,
  );
};

export interface Tests {
  readonly failing: number;
  readonly passing: number;
  readonly suites: ReadonlyArray<TestSuite>;
}

export interface TestSuite {
  readonly basename: string;
  readonly dirname: string;
  readonly passing: number;
  readonly failing: number;
  readonly error?: string;
  readonly tests: ReadonlyArray<Test>;
}

export interface Test {
  readonly name: ReadonlyArray<string>;
  readonly state: 'pass' | 'fail' | 'skip';
  readonly error?: string;
}

export const runTests = ({ failing, passing, suites }: Tests) => {
  cy.get('[data-test=test]').click();
  suites.forEach((suite) => {
    cy.get(`[data-test="test-summary-list-item-/${suite.dirname}/${suite.basename}"]`).click();

    if (suite.error === undefined) {
      cy.get(`[data-test="test-detail-header"] [data-test=test-icon-running]`).should('exist');
      cy.get(
        `[data-test="test-summary-list-item-/${suite.dirname}/${suite.basename}"] [data-test=test-icon-running]`,
      ).should('exist');
      suite.tests.forEach((test) => {
        if (test.state !== 'skip') {
          cy.get(`[data-test="test-detail-list-item-${test.name.join('-')}"] [data-test=test-icon-running]`).should(
            'exist',
          );
        }
      });
    }
  });

  if (passing > 0) {
    cy.get('[data-test=test-summary-header] [data-test=test-summary-header-passing]').should(
      'have.text',
      `${passing}Passed`,
    );
  }
  if (failing > 0) {
    cy.get('[data-test=test-summary-header] [data-test=test-summary-header-failing]').should(
      'have.text',
      `${failing}Failed`,
    );
  }
  cy.get('[data-test=test-summary-header] [data-test=test-summary-header-total]').should(
    'have.text',
    `${suites.length}Total`,
  );
  cy.get('[data-test=test-summary-header] [data-test=test-summary-header-duration]').should('contain', 'ms');

  suites.forEach((suite) => {
    checkTestSuite(suite);
  });

  cy.get('[data-test=console-close]').click();
};

const checkTestSuite = ({ basename, dirname, failing, passing, error, tests }: TestSuite) => {
  if (failing > 0) {
    cy.get(`[data-test="test-summary-list-item-/${dirname}/${basename}"] [data-test=test-icon-failing]`).should(
      'exist',
    );
  } else if (passing > 0) {
    cy.get(`[data-test="test-summary-list-item-/${dirname}/${basename}"] [data-test=test-icon-passing]`).should(
      'exist',
    );
  } else {
    cy.get(`[data-test="test-summary-list-item-/${dirname}/${basename}"] [data-test=test-icon-skipped]`).should(
      'exist',
    );
  }
  cy.get(
    `[data-test="test-summary-list-item-/${dirname}/${basename}"] [data-test=test-summary-list-item-file-text] > [data-test=file-text-basename]`,
  ).should('have.text', basename);
  cy.get(
    `[data-test="test-summary-list-item-/${dirname}/${basename}"] [data-test=test-summary-list-item-file-text] > [data-test=file-text-dirname]`,
  ).should('have.text', dirname);

  cy.get(`[data-test="test-summary-list-item-/${dirname}/${basename}"]`).click();

  if (failing > 0) {
    cy.get(`[data-test="test-detail-header"] [data-test=test-icon-failing]`).should('exist');
  } else if (passing > 0) {
    cy.get(`[data-test="test-detail-header"] [data-test=test-icon-passing]`).should('exist');
  } else {
    cy.get(`[data-test="test-detail-header"] [data-test=test-icon-skipped]`).should('exist');
  }
  cy.get(
    `[data-test="test-detail-header"] [data-test=test-detail-header-file-text] > [data-test=file-text-basename]`,
  ).should('have.text', basename);
  cy.get(
    `[data-test="test-detail-header"] [data-test=test-detail-header-file-text] > [data-test=file-text-dirname]`,
  ).should('have.text', dirname);

  if (passing > 0) {
    cy.get('[data-test=test-detail-header] [data-test=test-summary-header-passing]').should(
      'have.text',
      `${passing}Passed`,
    );
  }
  if (failing > 0) {
    cy.get('[data-test=test-detail-header] [data-test=test-summary-header-failing]').should(
      'have.text',
      `${failing}Failed`,
    );
  }
  cy.get('[data-test=test-detail-header] [data-test=test-summary-header-total]').should(
    'have.text',
    `${tests.length + (error === undefined ? 0 : 1)}Total`,
  );
  cy.get('[data-test=test-summary-header] [data-test=test-summary-header-duration]').should('contain', 'ms');

  if (error === undefined) {
    tests.forEach((test) => {
      checkTest(test);
    });
  } else {
    cy.get('[data-test=test-detail-list-error]').should('contain', error);
  }
};

const checkTest = ({ name, state, error }: Test) => {
  if (state === 'fail') {
    cy.get(`[data-test="test-detail-list-item-${name.join('-')}"] [data-test=test-icon-failing]`).should('exist');
  } else if (state === 'pass') {
    cy.get(`[data-test="test-detail-list-item-${name.join('-')}"] [data-test=test-icon-passing]`).should('exist');
  } else {
    cy.get(`[data-test="test-detail-list-item-${name.join('-')}"] [data-test=test-icon-skipped]`).should('exist');
  }

  cy.get(`[data-test="test-detail-list-item-${name.join('-')}"] [data-test=test-detail-list-item-text]`).should(
    'have.text',
    name.join(' > '),
  );

  if (error !== undefined) {
    cy.get(`[data-test="test-detail-list-item-${name.join('-')}"] [data-test=test-detail-list-item-error]`).should(
      'contain',
      error,
    );
  }
};

export const enterSolution = ({
  path,
  skipBackspace = false,
}: {
  readonly path: string;
  readonly skipBackspace?: boolean;
}) => {
  cy.get('[data-test=docs-footer-solution-button]').click();
  cy.get(`[data-test="docs-solution-file-tab-${path}"]`).click();
  cy.get('[data-test=monaco-editor] .view-lines').click();
  cy.get('[data-test=monaco-editor] > div').should('have.class', 'focused');
  cy.get('[data-test=monaco-editor] textarea')
    .type('{cmd}a')
    .type('{backspace}');
  cy.get('[data-test=docs-solution-markdown] > .code-toolbar > pre > code').then(($outerEl) => {
    cy.get('[data-test=monaco-editor] textarea').type($outerEl.text().replace(/\{/g, '{{}'));
  });
  if (!skipBackspace) {
    cy.get('[data-test=monaco-editor] textarea').type('{backspace}');
    cy.get('[data-test=monaco-editor] textarea').type('{backspace}');
  }
};

interface BuildOptions {
  readonly success: boolean;
}

export const build = ({ success }: BuildOptions) => {
  cy.get('[data-test=build]', { timeout: 60000 }).click();
  const text = success
    ? 'Scanning for contracts...\nSetting up wallets...\nCompiling contract Token...\nGenerating code...\nDone'
    : 'Scanning for contracts...\nNo contracts found.';
  cy.get('[data-test=console-output]').should('have.text', text);
  cy.get('[data-test=console-selector]').should('have.value', 'neo-one');
  cy.get('[data-test=console-header-clear] > [data-test=console-button]').click();
  cy.get('[data-test=console-output]').should('have.text', '');
  cy.get('[data-test=console-close]').click();
};

export const nextButton = () => {
  cy.get('[data-test=next-button]').click();
};
