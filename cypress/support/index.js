if (Cypress.env('coverageDir')) {
  afterEach(function() {
    cy.window().then((win) => {
      const coverage = win.__coverage__;
      if (coverage) {
        cy.task('writeCoverage', { coverage, coverageDir: Cypress.env('coverageDir') });
      }
    });
  });
}
