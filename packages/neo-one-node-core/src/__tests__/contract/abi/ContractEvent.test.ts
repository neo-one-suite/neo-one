import { contractEvent, contractParamDeclaration, testContext as context } from '../../../__data__';
import { ContractEvent } from '../../../contract';

describe('ContractEvent', () => {
  test('serialize/deserialize - one param', () => {
    const event = contractEvent();
    const serialized = event.serializeWire();
    const deserialized = ContractEvent.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.name).toEqual(event.name);
    expect(deserialized.parameters.length).toEqual(1);
    expect(deserialized.parameters[0].name).toEqual(event.parameters[0].name);
    expect(deserialized.parameters[0].type).toEqual(event.parameters[0].type);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON();
    expect(serializedJson.name).toEqual(event.name);
    expect(serializedJson.parameters[0].name).toEqual('param');
    expect(serializedJson.parameters[0].type).toEqual('Boolean');
  });

  test('serialize/deserialize - multiple params', () => {
    const event = contractEvent([
      contractParamDeclaration.array,
      contractParamDeclaration.integer,
      contractParamDeclaration.byteArray,
    ]);
    const serialized = event.serializeWire();
    const deserialized = ContractEvent.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.name).toEqual(event.name);
    expect(deserialized.parameters.length).toEqual(3);
    deserialized.parameters.forEach((param, idx) => {
      expect(param.name).toEqual(event.parameters[idx].name);
    });
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON();
    expect(serializedJson.name).toEqual(event.name);
    expect(serializedJson.parameters[0].name).toEqual('param');
    expect(serializedJson.parameters[0].type).toEqual('Array');
    expect(serializedJson.parameters[1].name).toEqual('param');
    expect(serializedJson.parameters[1].type).toEqual('Integer');
    expect(serializedJson.parameters[2].name).toEqual('param');
    expect(serializedJson.parameters[2].type).toEqual('ByteArray');
  });
});
