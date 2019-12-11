import { contractFunction, contractParamDeclaration, jsonContext, testContext as context } from '../../../__data__';
import { ContractFunction, ContractParameterType } from '../../../contract';

describe('ContractFunction', () => {
  test('serialize/deserialize - one param', () => {
    const fn = contractFunction();
    const serialized = fn.serializeWire();
    const deserialized = ContractFunction.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.name).toEqual(fn.name);
    expect(deserialized.parameters.length).toEqual(1);
    expect(deserialized.parameters[0].name).toEqual(fn.parameters[0].name);
    expect(deserialized.parameters[0].type).toEqual(fn.parameters[0].type);
    expect(deserialized.returnType).toEqual(fn.returnType);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(fn.name);
    expect(serializedJson.parameters[0].name).toEqual('param');
    expect(serializedJson.parameters[0].type).toEqual('Boolean');
    expect(serializedJson.returnType).toEqual('Void');
  });

  test('serialize/deserialize - multiple params', () => {
    const fn = contractFunction(
      [contractParamDeclaration.array, contractParamDeclaration.integer, contractParamDeclaration.byteArray],
      ContractParameterType.String,
    );
    const serialized = fn.serializeWire();
    const deserialized = ContractFunction.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.name).toEqual(fn.name);
    expect(deserialized.parameters.length).toEqual(3);
    deserialized.parameters.forEach((param, idx) => {
      expect(param.name).toEqual(fn.parameters[idx].name);
    });
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.name).toEqual(fn.name);
    expect(serializedJson.parameters[0].name).toEqual('param');
    expect(serializedJson.parameters[0].type).toEqual('Array');
    expect(serializedJson.parameters[1].name).toEqual('param');
    expect(serializedJson.parameters[1].type).toEqual('Integer');
    expect(serializedJson.parameters[2].name).toEqual('param');
    expect(serializedJson.parameters[2].type).toEqual('ByteArray');
    expect(serializedJson.returnType).toEqual('String');
  });
});
