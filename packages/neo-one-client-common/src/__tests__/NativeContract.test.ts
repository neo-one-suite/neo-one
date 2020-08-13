import { Buffer } from 'buffer';
import { common } from '../common';
import { NativeContracts } from '../NativeContract';

const neoContractHardCoded = {
  serviceName: 'Neo.Native.Tokens.NEO',
  script: Buffer.from('6845c49284', 'hex'),
  scriptHex: '6845c49284',
  hash: common.hexToUInt160('0x43cf98eddbe047e198a3e5d57006311442a0ca15'),
  scriptHash: '0x43cf98eddbe047e198a3e5d57006311442a0ca15',
};

const gasContractHardCoded = {
  serviceName: 'Neo.Native.Tokens.GAS',
  script: Buffer.from('68eb43f4f4', 'hex'),
  scriptHex: '68eb43f4f4',
  hash: common.hexToUInt160('0xa1760976db5fcdfab2a9930e8f6ce875b2d18225'),
  scriptHash: '0xa1760976db5fcdfab2a9930e8f6ce875b2d18225',
};

const policyContractHardCoded = {
  serviceName: 'Neo.Native.Policy',
  script: Buffer.from('6875f4fa6b', 'hex'),
  scriptHex: '6875f4fa6b',
  hash: common.hexToUInt160('0x9c5699b260bd468e2160dd5d45dfd2686bba8b77'),
  scriptHash: '0x9c5699b260bd468e2160dd5d45dfd2686bba8b77',
};

describe('NativeContract correct data', () => {
  test('NEO', () => {
    expect(NativeContracts.NEO.serviceName).toEqual(neoContractHardCoded.serviceName);
    expect(NativeContracts.NEO.script).toEqual(neoContractHardCoded.script);
    expect(NativeContracts.NEO.scriptHex).toEqual(neoContractHardCoded.scriptHex);
    expect(NativeContracts.NEO.hash).toEqual(neoContractHardCoded.hash);
    expect(NativeContracts.NEO.scriptHash).toEqual(neoContractHardCoded.scriptHash);
  });

  test('GAS', () => {
    expect(NativeContracts.GAS.serviceName).toEqual(gasContractHardCoded.serviceName);
    expect(NativeContracts.GAS.script).toEqual(gasContractHardCoded.script);
    expect(NativeContracts.GAS.scriptHex).toEqual(gasContractHardCoded.scriptHex);
    expect(NativeContracts.GAS.hash).toEqual(gasContractHardCoded.hash);
    expect(NativeContracts.GAS.scriptHash).toEqual(gasContractHardCoded.scriptHash);
  });

  test('Policy', () => {
    expect(NativeContracts.Policy.serviceName).toEqual(policyContractHardCoded.serviceName);
    expect(NativeContracts.Policy.script).toEqual(policyContractHardCoded.script);
    expect(NativeContracts.Policy.scriptHex).toEqual(policyContractHardCoded.scriptHex);
    expect(NativeContracts.Policy.hash).toEqual(policyContractHardCoded.hash);
    expect(NativeContracts.Policy.scriptHash).toEqual(policyContractHardCoded.scriptHash);
  });
});
