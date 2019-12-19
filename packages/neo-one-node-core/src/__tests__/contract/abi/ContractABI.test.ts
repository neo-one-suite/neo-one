import { common } from '@neo-one/client-common';
import {
  contractParamDeclaration,
  createContractAbi,
  createContractEvent,
  createContractMethodDescriptor,
  testContext as context,
} from '../../../__data__';
import { ContractABI, ContractParameterType } from '../../../contract';

describe('ContractABI', () => {
  test('serialize/deserialize - one function/event', () => {
    const abi = createContractAbi();
    const serialized = abi.serializeWire();
    const deserialized = ContractABI.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.hash).toEqual(abi.hash);
    expect(JSON.stringify(deserialized.entryPoint)).toEqual(JSON.stringify(abi.entryPoint));
    expect(deserialized.methods.length).toEqual(1);
    expect(JSON.stringify(deserialized.methods)).toEqual(JSON.stringify(abi.methods));
    expect(deserialized.events.length).toEqual(1);
    expect(JSON.stringify(deserialized.events)).toEqual(JSON.stringify(abi.events));
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON();
    expect(serializedJson.hash).toEqual(common.uInt160ToHex(abi.hash));
    expect(serializedJson.entryPoint.name).toEqual(abi.entryPoint.name);
    expect(serializedJson.entryPoint.parameters[0].type).toEqual('Boolean');
    expect(serializedJson.methods[0].name).toEqual(abi.methods[0].name);
    expect(serializedJson.methods[0].parameters[0].type).toEqual('Boolean');
    expect(serializedJson.methods[0].returnType).toEqual('Void');
    expect(serializedJson.events[0].name).toEqual(abi.events[0].name);
    expect(serializedJson.events[0].parameters[0].type).toEqual('Boolean');
  });

  test('serialize/deserialize - multiple functions/events', () => {
    const abi = createContractAbi({
      methods: [
        createContractMethodDescriptor(),
        createContractMethodDescriptor({
          parameters: [contractParamDeclaration.integer, contractParamDeclaration.signature],
          returnType: ContractParameterType.String,
        }),
      ],
      events: [
        createContractEvent(),
        createContractEvent({ parameters: [] }),
        createContractEvent({ parameters: [contractParamDeclaration.hash256, contractParamDeclaration.hash160] }),
      ],
    });
    const serialized = abi.serializeWire();
    const deserialized = ContractABI.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.hash).toEqual(abi.hash);
    expect(JSON.stringify(deserialized.entryPoint)).toEqual(JSON.stringify(abi.entryPoint));
    expect(deserialized.methods.length).toEqual(2);
    expect(JSON.stringify(deserialized.methods)).toEqual(JSON.stringify(abi.methods));
    expect(deserialized.events.length).toEqual(3);
    expect(JSON.stringify(deserialized.events)).toEqual(JSON.stringify(abi.events));
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON();
    expect(serializedJson.hash).toEqual(common.uInt160ToHex(abi.hash));
    expect(serializedJson.entryPoint.name).toEqual(abi.entryPoint.name);
    expect(serializedJson.entryPoint.parameters[0].type).toEqual('Boolean');

    expect(serializedJson.methods[0].name).toEqual(abi.methods[0].name);
    expect(serializedJson.methods[0].parameters[0].type).toEqual('Boolean');
    expect(serializedJson.methods[0].returnType).toEqual('Void');
    expect(serializedJson.methods[1].name).toEqual(abi.methods[1].name);
    expect(serializedJson.methods[1].parameters[0].type).toEqual('Integer');
    expect(serializedJson.methods[1].parameters[1].type).toEqual('Signature');
    expect(serializedJson.methods[1].returnType).toEqual('String');

    expect(serializedJson.events[0].name).toEqual(abi.events[0].name);
    expect(serializedJson.events[0].parameters[0].type).toEqual('Boolean');
    expect(serializedJson.events[1].name).toEqual(abi.events[1].name);
    expect(serializedJson.events[1].parameters.length).toEqual(0);
    expect(serializedJson.events[2].name).toEqual(abi.events[2].name);
    expect(serializedJson.events[2].parameters[0].type).toEqual('Hash256');
    expect(serializedJson.events[2].parameters[1].type).toEqual('Hash160');
  });
});
