import { common, ECPoint, SignatureString, UInt160 } from '@neo-one/client-common';
import { constants } from '@neo-one/utils';
import {
  Contract,
  ContractABI,
  ContractEvent,
  ContractGroup,
  ContractManifest,
  ContractMethodDescriptor,
  ContractParameterDeclaration,
  ContractParameterType,
  ContractPermissionDescriptor,
  ContractPermissions,
  ContractPropertyState,
} from '../contract';

export const testContext = { messageMagic: 0 };

export const contractParamDeclaration = {
  boolean: new ContractParameterDeclaration({
    type: ContractParameterType.Boolean,
    name: 'param',
  }),
  byteArray: new ContractParameterDeclaration({
    type: ContractParameterType.ByteArray,
    name: 'param',
  }),
  hash160: new ContractParameterDeclaration({
    type: ContractParameterType.Hash160,
    name: 'param',
  }),
  hash256: new ContractParameterDeclaration({
    type: ContractParameterType.Hash256,
    name: 'param',
  }),
  array: new ContractParameterDeclaration({
    type: ContractParameterType.Array,
    name: 'param',
  }),
  integer: new ContractParameterDeclaration({
    type: ContractParameterType.Integer,
    name: 'param',
  }),
  interopInterface: new ContractParameterDeclaration({
    type: ContractParameterType.InteropInterface,
    name: 'param',
  }),
  map: new ContractParameterDeclaration({
    type: ContractParameterType.Map,
    name: 'param',
  }),
  publicKey: new ContractParameterDeclaration({
    type: ContractParameterType.PublicKey,
    name: 'param',
  }),
  signature: new ContractParameterDeclaration({
    type: ContractParameterType.Signature,
    name: 'param',
  }),
  string: new ContractParameterDeclaration({
    type: ContractParameterType.String,
    name: 'param',
  }),
  void: new ContractParameterDeclaration({
    type: ContractParameterType.Void,
    name: 'param',
  }),
};

export const contractEvent = (
  parameters: readonly ContractParameterDeclaration[] = [contractParamDeclaration.boolean],
  name = 'event',
) =>
  new ContractEvent({
    name,
    parameters,
  });

export const contractMethodDescriptor = (
  parameters: readonly ContractParameterDeclaration[] = [contractParamDeclaration.boolean],
  returnType: ContractParameterType = ContractParameterType.Void,
  name = 'event',
) =>
  new ContractMethodDescriptor({
    name,
    parameters,
    returnType,
  });

export const contractAbi = (
  methods: readonly ContractMethodDescriptor[] = [contractMethodDescriptor()],
  events: readonly ContractEvent[] = [contractEvent()],
  entryPoint: ContractMethodDescriptor = contractMethodDescriptor(),
  hash = common.bufferToUInt160(Buffer.alloc(20, 1)),
) => new ContractABI({ hash, entryPoint, methods, events });

export const contractGroup = (
  publicKey: ECPoint = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY),
  signature: SignatureString = 'ccaab040cc25021c91567b75db4778853441869157b8f6aad960cdcf1069812480027a528ca9b98e2205027de20696f848cf81824eeb7af1d5110870870ceb67',
) => new ContractGroup({ publicKey, signature });

export const contractPermissionDescriptor = (hashOrGroupType: 'uint160' | 'ecpoint' | undefined) => {
  let hashOrGroup: UInt160 | ECPoint | undefined;
  if (hashOrGroupType === 'uint160') {
    hashOrGroup = common.bufferToUInt160(Buffer.alloc(20, 1));
  } else if (hashOrGroupType === 'ecpoint') {
    hashOrGroup = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY);
  }

  return new ContractPermissionDescriptor({ hashOrGroup });
};

export const contractPermissions = (
  hashOrGroupType: 'uint160' | 'ecpoint' | undefined,
  methods: readonly string[] = [],
) => new ContractPermissions({ contract: contractPermissionDescriptor(hashOrGroupType), methods });

export const contractManifest = (
  groups: readonly ContractGroup[] = [contractGroup()],
  features: ContractPropertyState = ContractPropertyState.HasStoragePayable,
  abi: ContractABI = contractAbi(),
  permissions: readonly ContractPermissions[] = [contractPermissions('uint160', ['method1'])],
  trusts: readonly UInt160[] = [common.bufferToUInt160(Buffer.alloc(20, 1))],
  safeMethods: readonly string[] = ['method1', 'method2'],
) => new ContractManifest({ groups, features, abi, permissions, trusts, safeMethods });

export const contract = (script: Buffer = Buffer.alloc(25), manifest: ContractManifest = contractManifest()) =>
  new Contract({ script, manifest });
