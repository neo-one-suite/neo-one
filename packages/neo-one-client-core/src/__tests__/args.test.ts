import { data, keys } from '../__data__';
import * as args from '../args';

describe('arg assertions', () => {
  test('assertString - pass', () => {
    const value = 'foo';

    expect(args.assertString('value', value)).toEqual(value);
  });

  test('assertString - undefined', () => {
    const value = undefined;

    expect(() => args.assertString('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertString - non-string', () => {
    const value = 0;

    expect(() => args.assertString('value', value)).toThrowErrorMatchingSnapshot();
  });
  test('assertAddress - address', () => {
    const value = keys[0].address;

    expect(args.assertAddress('value', value)).toEqual(value);
  });

  test('assertAddress - scriptHash', () => {
    const value = keys[0].scriptHashString;

    expect(args.assertAddress('value', value)).toEqual(keys[0].address);
  });

  test('assertAddress - undefined', () => {
    const value = undefined;

    expect(() => args.assertAddress('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertAddress - non-string', () => {
    const value = 0;

    expect(() => args.assertAddress('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertAddress - non-address', () => {
    const value = data.hash256s.a;

    expect(() => args.assertAddress('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertHash256 - hash', () => {
    const value = data.hash256s.a;

    expect(args.assertHash256('value', value)).toEqual(value);
  });

  test('assertHash256 - undefined', () => {
    const value = undefined;

    expect(() => args.assertHash256('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertHash256 - non-string', () => {
    const value = 0;

    expect(() => args.assertHash256('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertHash256 - non-hash', () => {
    const value = keys[0].scriptHashString;

    expect(() => args.assertHash256('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertBuffer - buffer', () => {
    const value = data.buffers.a;

    expect(args.assertBuffer('value', value)).toEqual(value);
  });

  test('assertBuffer - undefined', () => {
    const value = undefined;

    expect(() => args.assertBuffer('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertBuffer - non-string', () => {
    const value = 0;

    expect(() => args.assertBuffer('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertBuffer - non-hex', () => {
    const value = data.hash256s.a;

    expect(() => args.assertBuffer('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertPublicKey - public key', () => {
    const value = keys[0].publicKeyString;

    expect(args.assertPublicKey('value', value)).toEqual(value);
  });

  test('assertPublicKey - undefined', () => {
    const value = undefined;

    expect(() => args.assertPublicKey('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertPublicKey - non-string', () => {
    const value = 0;

    expect(() => args.assertPublicKey('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertPublicKey - non public key', () => {
    const value = data.buffers.a;

    expect(() => args.assertPublicKey('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertBigNumber - BigNumber', () => {
    const value = data.bigNumbers.a;

    expect(args.assertBigNumber('value', value)).toEqual(value);
  });

  test('assertBigNumber - undefined', () => {
    const value = undefined;

    expect(() => args.assertBigNumber('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertBigNumber - non BigNumber', () => {
    const value = 0;

    expect(() => args.assertBigNumber('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertBoolean - boolean', () => {
    const value = true;

    expect(args.assertBoolean('value', value)).toEqual(value);
  });

  test('assertBoolean - undefined', () => {
    const value = undefined;

    expect(() => args.assertBoolean('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertBoolean - non boolean', () => {
    const value = 0;

    expect(() => args.assertBoolean('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertNullableBoolean - boolean', () => {
    const value = false;

    expect(args.assertNullableBoolean('value', value)).toEqual(value);
  });

  test('assertNullableBoolean - undefined', () => {
    const value = undefined;

    expect(args.assertNullableBoolean('value', value)).toEqual(value);
  });

  test('assertNullableBoolean - non boolean', () => {
    const value = 0;

    expect(() => args.assertNullableBoolean('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertNumber - number', () => {
    const value = data.numbers.a;

    expect(args.assertNumber('value', value)).toEqual(value);
  });

  test('assertNumber - undefined', () => {
    const value = undefined;

    expect(() => args.assertNumber('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertNumber - non number', () => {
    const value = true;

    expect(() => args.assertNumber('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertNullableNumber - number', () => {
    const value = data.numbers.a;

    expect(args.assertNullableNumber('value', value)).toEqual(value);
  });

  test('assertNullableNumber - undefined', () => {
    const value = undefined;

    expect(args.assertNullableNumber('value', value)).toEqual(value);
  });

  test('assertNullableNumber - non number', () => {
    const value = true;

    expect(() => args.assertNullableNumber('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertArray - array', () => {
    const value = [data.numbers.a];

    expect(args.assertArray('value', value)).toEqual(value);
  });

  test('assertArray - undefined', () => {
    const value = undefined;

    expect(() => args.assertArray('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertArray - non array', () => {
    const value = true;

    expect(() => args.assertArray('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertNullableArray - array', () => {
    const value = [data.numbers.a];

    expect(args.assertNullableArray('value', value)).toEqual(value);
  });

  test('assertNullableArray - undefined', () => {
    const value = undefined;

    expect(args.assertNullableArray('value', value)).toEqual([]);
  });

  test('assertNullableArray - non array', () => {
    const value = true;

    expect(() => args.assertNullableArray('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertABI - returnSignature', () => {
    const value = data.abi.returnSignature;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - returnBoolean', () => {
    const value = data.abi.returnBoolean;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - returnAddress', () => {
    const value = data.abi.returnAddress;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - returnHash256', () => {
    const value = data.abi.returnHash256;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - returnBuffer', () => {
    const value = data.abi.returnBuffer;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - returnPublicKey', () => {
    const value = data.abi.returnPublicKey;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - returnString', () => {
    const value = data.abi.returnString;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - returnArray', () => {
    const value = data.abi.returnArray;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - returnVoid', () => {
    const value = data.abi.returnVoid;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - returnInteger', () => {
    const value = data.abi.returnInteger;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - paramSignature', () => {
    const value = data.abi.paramSignature;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - paramBoolean', () => {
    const value = data.abi.paramBoolean;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - paramAddress', () => {
    const value = data.abi.paramAddress;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - paramHash256', () => {
    const value = data.abi.paramHash256;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - paramBuffer', () => {
    const value = data.abi.paramBuffer;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - paramPublicKey', () => {
    const value = data.abi.paramPublicKey;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - paramString', () => {
    const value = data.abi.paramString;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - paramArray', () => {
    const value = data.abi.paramArray;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - paramVoid', () => {
    const value = data.abi.paramVoid;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - paramInteger', () => {
    const value = data.abi.paramInteger;

    expect(args.assertABI('value', value)).toEqual(value);
  });

  test('assertABI - undefined', () => {
    const value = undefined;

    expect(() => args.assertABI('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertABI - non object', () => {
    const value = true;

    expect(() => args.assertABI('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertABI - invalidType', () => {
    const value = data.abi.invalidType;

    expect(() => args.assertABI('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertABI - invalidReturnType', () => {
    const value = data.abi.invalidReturnType;

    expect(() => args.assertABI('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertABI - invalidParameterType', () => {
    const value = data.abi.invalidParameterType;

    expect(() => args.assertABI('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertABI - invalidFunction', () => {
    const value = data.abi.invalidFunction;

    expect(() => args.assertABI('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertABI - invalidFunctions', () => {
    const value = data.abi.invalidFunctions;

    expect(() => args.assertABI('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertABI - invalidEvent', () => {
    const value = data.abi.invalidEvent;

    expect(() => args.assertABI('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertABI - invalidEvents', () => {
    const value = data.abi.invalidEvents;

    expect(() => args.assertABI('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertSmartContractDefinition - valid', () => {
    const value = data.smartContractDefinition.valid;

    expect(args.assertSmartContractDefinition('value', value)).toEqual(value);
  });

  test('assertSmartContractDefinition - undefined', () => {
    const value = undefined;

    expect(() => args.assertSmartContractDefinition('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertSmartContractDefinition - non object', () => {
    const value = true;

    expect(() => args.assertSmartContractDefinition('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertSmartContractDefinition - invalid', () => {
    const value = data.smartContractDefinition.invalid;

    expect(() => args.assertSmartContractDefinition('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertSmartContractDefinition - invalidNetworks', () => {
    const value = data.smartContractDefinition.invalidNetworks;

    expect(() => args.assertSmartContractDefinition('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertSmartContractDefinition - invalidNetwork', () => {
    const value = data.smartContractDefinition.invalidNetwork;

    expect(() => args.assertSmartContractDefinition('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertUserAccountID - valid', () => {
    const value = data.userAccountIDs.a;

    expect(args.assertUserAccountID('value', value)).toEqual(value);
  });

  test('assertUserAccountID - undefined', () => {
    const value = undefined;

    expect(() => args.assertUserAccountID('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertUserAccountID - non object', () => {
    const value = true;

    expect(() => args.assertUserAccountID('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertUpdateAccountNameOptions - valid', () => {
    const value = data.updateUserAccountNameOptions.valid;

    expect(args.assertUpdateAccountNameOptions('value', value)).toEqual(value);
  });

  test('assertUpdateAccountNameOptions - undefined', () => {
    const value = undefined;

    expect(() => args.assertUpdateAccountNameOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertUpdateAccountNameOptions - non object', () => {
    const value = true;

    expect(() => args.assertUpdateAccountNameOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertTransfers - valid', () => {
    const value = data.transfers.valid;

    expect(args.assertTransfers('value', value)).toEqual(value);
  });

  test('assertTransfers - undefined', () => {
    const value = undefined;

    expect(() => args.assertTransfers('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertTransfers - non object', () => {
    const value = true;

    expect(() => args.assertTransfers('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertTransfers - invalidTransfer', () => {
    const value = data.transfers.invalidTransfer;

    expect(() => args.assertTransfers('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertAttribute - hash1', () => {
    const value = data.attributes.hash1;

    expect(args.assertAttribute('value', value)).toEqual(value);
  });

  test('assertAttribute - script', () => {
    const value = data.attributes.script;

    expect(args.assertAttribute('value', value)).toEqual(value);
  });

  test('assertAttribute - ecdh02', () => {
    const value = data.attributes.ecdh02;

    expect(args.assertAttribute('value', value)).toEqual(value);
  });

  test('assertAttribute - description', () => {
    const value = data.attributes.description;

    expect(args.assertAttribute('value', value)).toEqual(value);
  });

  test('assertAttribute - undefined', () => {
    const value = undefined;

    expect(() => args.assertAttribute('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertAttribute - non object', () => {
    const value = true;

    expect(() => args.assertAttribute('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertAttribute - invalid', () => {
    const value = data.attributes.invalid;

    expect(() => args.assertAttribute('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertAttribute - invalid usage', () => {
    const value = data.attributes.invalidUsage;

    expect(() => args.assertAttribute('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertTransactionOptions - valid', () => {
    const value = data.transactionOptions.valid;

    expect(args.assertTransactionOptions('value', value)).toEqual(value);
  });

  test('assertTransactionOptions - onlyFrom', () => {
    const value = data.transactionOptions.onlyFrom;

    expect(args.assertTransactionOptions('value', value)).toEqual({ ...value, attributes: [] });
  });

  test('assertTransactionOptions - onlyFromScriptHash', () => {
    const value = data.transactionOptions.onlyFromScriptHash;

    expect(args.assertTransactionOptions('value', value)).toEqual({
      ...data.transactionOptions.onlyFrom,
      attributes: [],
    });
  });

  test('assertTransactionOptions - onlyAttributes', () => {
    const value = data.transactionOptions.onlyAttributes;

    expect(args.assertTransactionOptions('value', value)).toEqual(value);
  });

  test('assertTransactionOptions - onlyAttributesScriptHash', () => {
    const value = data.transactionOptions.onlyAttributesScriptHash;

    expect(args.assertTransactionOptions('value', value)).toEqual(data.transactionOptions.onlyAttributes);
  });

  test('assertTransactionOptions - onlyNetworkFee', () => {
    const value = data.transactionOptions.onlyNetworkFee;

    expect(args.assertTransactionOptions('value', value)).toEqual({ ...value, attributes: [] });
  });

  test('assertTransactionOptions - empty', () => {
    const value = data.transactionOptions.empty;

    expect(args.assertTransactionOptions('value', value)).toEqual({ attributes: [] });
  });

  test('assertTransactionOptions - undefined', () => {
    const value = undefined;

    expect(args.assertTransactionOptions('value', value)).toEqual({});
  });

  test('assertTransactionOptions - non object', () => {
    const value = true;

    expect(() => args.assertTransactionOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertTransactionOptions - invalidFrom', () => {
    const value = data.transactionOptions.invalidFrom;

    expect(() => args.assertTransactionOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertTransactionOptions - invalidAttributes', () => {
    const value = data.transactionOptions.invalidAttributes;

    expect(() => args.assertTransactionOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertTransactionOptions - invalidNetworkFee', () => {
    const value = data.transactionOptions.invalidNetworkFee;

    expect(() => args.assertTransactionOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - notDefined', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.notDefined;

    expect(args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toEqual({});
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - valid', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.valid;

    expect(args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toEqual(value);
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - onlyFrom', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.onlyFrom;

    expect(args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toEqual({ ...value, attributes: [] });
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - onlyFromScriptHash', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.onlyFromScriptHash;

    expect(args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toEqual({
      ...data.invokeSendUnsafeReceiveTransactionOptions.onlyFrom,
      attributes: [],
    });
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - onlyAttributes', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.onlyAttributes;

    expect(args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toEqual(value);
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - onlyAttributesScriptHash', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.onlyAttributesScriptHash;

    expect(args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toEqual(
      data.invokeSendUnsafeReceiveTransactionOptions.onlyAttributes,
    );
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - onlyNetworkFee', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.onlyNetworkFee;

    expect(args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toEqual({ ...value, attributes: [] });
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - empty', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.empty;

    expect(args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toEqual({ attributes: [] });
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - undefined', () => {
    const value = undefined;

    expect(args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toEqual({});
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - non object', () => {
    const value = true;

    expect(() => args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - invalidFrom', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.invalidFrom;

    expect(() => args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - invalidAttributes', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.invalidAttributes;

    expect(() => args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - invalidNetworkFee', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.invalidNetworkFee;

    expect(() => args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - onlySendTo', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.onlySendTo;

    expect(args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toEqual({
      ...value,
      attributes: [],
    });
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - onlySendFromsValid', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.onlySendFromsInvalid;

    expect(() => args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertInvokeSendUnsafeReceiveTransactionOptions - onlySendFromValid', () => {
    const value = data.invokeSendUnsafeReceiveTransactionOptions.onlySendFromValid;

    expect(args.assertInvokeSendUnsafeReceiveTransactionOptions('value', value)).toEqual({ ...value, attributes: [] });
  });

  test('assertNullableIterOptions - notDefined', () => {
    const value = data.iterOptions.notDefined;

    expect(args.assertNullableIterOptions('value', value)).toEqual(undefined);
  });

  test('assertNullableIterOptions - empty', () => {
    const value = data.iterOptions.empty;

    expect(args.assertNullableIterOptions('value', value)).toEqual(value);
  });

  test('assertNullableIterOptions - notObject', () => {
    const value = data.iterOptions.notObject;

    expect(() => args.assertNullableIterOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertNullableIterOptions - onlyIndexStart', () => {
    const value = data.iterOptions.onlyIndexStart;

    expect(args.assertNullableIterOptions('value', value)).toEqual(value);
  });

  test('assertNullableIterOptions - onlyIndexStop', () => {
    const value = data.iterOptions.onlyIndexStop;

    expect(args.assertNullableIterOptions('value', value)).toEqual(value);
  });

  test('assertNullableIterOptions - validBlockFilter', () => {
    const value = data.iterOptions.validBlockFilter;

    expect(args.assertNullableIterOptions('value', value)).toEqual(value);
  });

  test('assertNullableIterOptions - invalidStart', () => {
    const value = data.iterOptions.invalidStart;

    expect(() => args.assertNullableIterOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertNullableIterOptions - invalidStop', () => {
    const value = data.iterOptions.invalidStop;

    expect(() => args.assertNullableIterOptions('value', value)).toThrowErrorMatchingSnapshot();
  });

  test('assertNullableIterOptions - invalidBlockFilter', () => {
    const value = data.iterOptions.invalidBlockFilter;

    expect(() => args.assertNullableIterOptions('value', value)).toThrowErrorMatchingSnapshot();
  });
});
