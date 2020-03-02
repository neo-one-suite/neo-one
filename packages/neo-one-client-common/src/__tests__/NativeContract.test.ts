import { Buffer } from 'buffer';
import { common } from '../common';
import { NativeContracts } from '../NativeContract';

const NEO_Hardcoded = {
  serviceName: 'Neo.Native.Tokens.NEO',
  script: Buffer.from('6845c49284', 'hex'),
  scriptHex: '6845c49284',
  hash: common.hexToUInt160('0x43cf98eddbe047e198a3e5d57006311442a0ca15'),
  scriptHash: '0x43cf98eddbe047e198a3e5d57006311442a0ca15',
};

const GAS_Hardcoded = {
  serviceName: 'Neo.Native.Tokens.GAS',
  script: Buffer.from('68eb43f4f4', 'hex'),
  scriptHex: '68eb43f4f4',
  hash: common.hexToUInt160('0xa1760976db5fcdfab2a9930e8f6ce875b2d18225'),
  scriptHash: '0xa1760976db5fcdfab2a9930e8f6ce875b2d18225',
};

const Policy_Hardcoded = {
  serviceName: 'Neo.Native.Policy',
  script: Buffer.from('6875f4fa6b', 'hex'),
  scriptHex: '6875f4fa6b',
  hash: common.hexToUInt160('0x9c5699b260bd468e2160dd5d45dfd2686bba8b77'),
  scriptHash: '0x9c5699b260bd468e2160dd5d45dfd2686bba8b77',
};

describe('NativeContract correct data', () => {
  test('NEO', () => {
    expect(NativeContracts.NEO.serviceName).toEqual(NEO_Hardcoded.serviceName);
    expect(NativeContracts.NEO.script).toEqual(NEO_Hardcoded.script);
    expect(NativeContracts.NEO.scriptHex).toEqual(NEO_Hardcoded.scriptHex);
    expect(NativeContracts.NEO.hash).toEqual(NEO_Hardcoded.hash);
    expect(NativeContracts.NEO.scriptHash).toEqual(NEO_Hardcoded.scriptHash);
  });

  test('GAS', () => {
    expect(NativeContracts.GAS.serviceName).toEqual(GAS_Hardcoded.serviceName);
    expect(NativeContracts.GAS.script).toEqual(GAS_Hardcoded.script);
    expect(NativeContracts.GAS.scriptHex).toEqual(GAS_Hardcoded.scriptHex);
    expect(NativeContracts.GAS.hash).toEqual(GAS_Hardcoded.hash);
    expect(NativeContracts.GAS.scriptHash).toEqual(GAS_Hardcoded.scriptHash);
  });

  test('Policy', () => {
    expect(NativeContracts.Policy.serviceName).toEqual(Policy_Hardcoded.serviceName);
    expect(NativeContracts.Policy.script).toEqual(Policy_Hardcoded.script);
    expect(NativeContracts.Policy.scriptHex).toEqual(Policy_Hardcoded.scriptHex);
    expect(NativeContracts.Policy.hash).toEqual(Policy_Hardcoded.hash);
    expect(NativeContracts.Policy.scriptHash).toEqual(Policy_Hardcoded.scriptHash);
  });
});
