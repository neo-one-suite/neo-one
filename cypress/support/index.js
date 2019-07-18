import 'cypress-plugin-retries';

if (Cypress.env('coverageDir')) {
  afterEach(function() {
    cy.window().then((win) => {
      const coverage = win.__coverage__;
      if (coverage) {
        cy.task('writeCoverage', {
          coverage,
          coverageDir: Cypress.env('coverageDir'),
        });
      }
    });
  });
}

Cypress.on('uncaught:exception', (err, _runnable) => {
  if (
    err.message.includes("Cannot read property 'emitNode' of undefined") ||
    err.message.includes("Cannot read property 'name' of undefined")
  ) {
    return false;
  }
});
