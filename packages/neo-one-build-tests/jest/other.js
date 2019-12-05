// Tests which are not meant to run in the standard test suite.
const unit = require('./unit');

module.exports = {
  ...unit,
  displayName: 'other',
  testRegex: '^.*/__other_tests__/.*\\.test\\.tsx?$',
};
