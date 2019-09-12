const CLASS_NAMES = new Set([
  'Account',
  'Asset',
  'Block',
  'Contract',
  'Header',
  'InvocationResultSuccess',
  'InvocationResultError',
  'Validator',
  'Witness',
  'ClaimTransaction',
  'ContractTransaction',
  'EnrollmentTransaction',
  'InvocationTransaction',
  'IssueTransaction',
  'MinerTransaction',
  'PublishTransaction',
  'RegisterTransaction',
  'Input',
  'Output',
  'BufferAttribute',
  'ECPointAttribute',
  'UInt160Attribute',
  'UInt256Attribute',
  'ArrayContractParameter',
  'BooleanContractParameter',
  'ByteArrayContractParameter',
  'Hash160ContractParameter',
  'Hash256ContractParameter',
  'IntegerContractParameter',
  'InteropInterfaceContractParameter',
  'PublicKeyContractParameter',
  'SignatureContractParameter',
  'StringContractParameter',
  'VoidContractParameter',
]);

module.exports = {
  print(val, serialize) {
    const obj = {};
    for (const key of Object.getOwnPropertyNames(val)) {
      if (typeof val[key] !== 'function') {
        obj[key] = val[key];
      }
    }

    obj.__$type = val.constructor.name;
    return serialize(obj);
  },

  test(val) {
    return val && val.constructor && CLASS_NAMES.has(val.constructor.name);
  },
};
