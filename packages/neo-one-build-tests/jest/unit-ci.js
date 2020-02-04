const unit = require('./unit');
const ci = require('./ci');

module.exports = config = {
  ...unit,
  ...ci('unit'),
};
