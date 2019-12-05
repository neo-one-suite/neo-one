const unit = require('./unit');

module.exports = {
  ...unit,
  displayName: 'ledger',
  testRegex: '^.*/__ledger_tests__/.*\\.test\\.tsx?$',
};
