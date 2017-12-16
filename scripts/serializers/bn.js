// eslint-disable-next-line
const BN = require('bn.js');

module.exports = {
  print(val, serialize) {
    return serialize(val.toString(10));
  },

  test(val) {
    return val instanceof BN;
  },
};
