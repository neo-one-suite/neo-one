const unit = require('./unit');
const ci = require('./ci');

module.exports = {
  ...unit,
  ...ci('unit'),
};
