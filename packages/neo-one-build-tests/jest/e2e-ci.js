const e2e = require('./e2e');
const ci = require('./ci');

module.exports = {
  ...e2e,
  ...ci('e2e'),
};
