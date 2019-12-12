import { contractParamDeclaration, jsonContext, testContext as context } from '../../../../__data__';
import { ContractParameterDeclaration } from '../../../../contract';

describe('ContractParameterDeclaration', () => {
  test('serialize/deserialize - boolean', () => {
    const serialized = contractParamDeclaration.boolean.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.boolean.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.boolean.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.boolean.name);
    expect(serializedJson.type).toEqual('Boolean');
  });

  test('serialize/deserialize - byteArray', () => {
    const serialized = contractParamDeclaration.byteArray.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.byteArray.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.byteArray.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.byteArray.name);
    expect(serializedJson.type).toEqual('ByteArray');
  });

  test('serialize/deserialize - hash160', () => {
    const serialized = contractParamDeclaration.hash160.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.hash160.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.hash160.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.hash160.name);
    expect(serializedJson.type).toEqual('Hash160');
  });

  test('serialize/deserialize - hash256', () => {
    const serialized = contractParamDeclaration.hash256.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.hash256.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.hash256.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.hash256.name);
    expect(serializedJson.type).toEqual('Hash256');
  });

  test('serialize/deserialize - array', () => {
    const serialized = contractParamDeclaration.array.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.array.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.array.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.array.name);
    expect(serializedJson.type).toEqual('Array');
  });

  test('serialize/deserialize - integer', () => {
    const serialized = contractParamDeclaration.integer.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.integer.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.integer.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.integer.name);
    expect(serializedJson.type).toEqual('Integer');
  });

  test('serialize/deserialize - interopInterface', () => {
    const serialized = contractParamDeclaration.interopInterface.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.interopInterface.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.interopInterface.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.interopInterface.name);
    expect(serializedJson.type).toEqual('InteropInterface');
  });

  test('serialize/deserialize - map', () => {
    const serialized = contractParamDeclaration.map.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.map.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.map.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.map.name);
    expect(serializedJson.type).toEqual('Map');
  });

  test('serialize/deserialize - publicKey', () => {
    const serialized = contractParamDeclaration.publicKey.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.publicKey.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.publicKey.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.publicKey.name);
    expect(serializedJson.type).toEqual('PublicKey');
  });

  test('serialize/deserialize - signature', () => {
    const serialized = contractParamDeclaration.signature.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.signature.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.signature.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.signature.name);
    expect(serializedJson.type).toEqual('Signature');
  });

  test('serialize/deserialize - string', () => {
    const serialized = contractParamDeclaration.string.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.string.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.string.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.string.name);
    expect(serializedJson.type).toEqual('String');
  });

  test('serialize/deserialize - void', () => {
    const serialized = contractParamDeclaration.void.serializeWire();
    const deserialized = ContractParameterDeclaration.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.type).toEqual(contractParamDeclaration.void.type);
    expect(deserialized.name).toEqual(contractParamDeclaration.void.name);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(contractParamDeclaration.void.name);
    expect(serializedJson.type).toEqual('Void');
  });
});
