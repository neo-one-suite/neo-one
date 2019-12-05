module.exports = {
  print(val, serialize) {
    return serialize(val.toString('hex'));
  },

  test(val) {
    return val instanceof Buffer;
  },
};
