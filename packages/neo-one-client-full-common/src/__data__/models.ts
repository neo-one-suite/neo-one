import { common, ContractParameterTypeModel, ECPoint, SignatureString, UInt160 } from '@neo-one/client-common';
import { constants } from '@neo-one/utils';
import {
  ContractABIModel,
  ContractEventModel,
  ContractGroupModel,
  ContractManifestModel,
  ContractMethodDescriptorModel,
  ContractModel,
  ContractParameterDeclarationModel,
  ContractPermissionDescriptorModel,
  ContractPermissionsModel,
  ContractPropertyStateModel,
} from '../models';

export const contractParamModel = {
  boolean: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.Boolean,
    name: 'param',
  }),
  byteArray: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.ByteArray,
    name: 'param',
  }),
  hash160: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.Hash160,
    name: 'param',
  }),
  hash256: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.Hash256,
    name: 'param',
  }),
  array: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.Array,
    name: 'param',
  }),
  integer: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.Integer,
    name: 'param',
  }),
  interopInterface: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.InteropInterface,
    name: 'param',
  }),
  map: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.Map,
    name: 'param',
  }),
  publicKey: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.PublicKey,
    name: 'param',
  }),
  signature: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.Signature,
    name: 'param',
  }),
  string: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.String,
    name: 'param',
  }),
  void: new ContractParameterDeclarationModel({
    type: ContractParameterTypeModel.Void,
    name: 'param',
  }),
};

export const contractMethodDescriptorModel = (
  parameters: readonly ContractParameterDeclarationModel[] = [contractParamModel.boolean],
  returnType: ContractParameterTypeModel = ContractParameterTypeModel.Void,
  name = 'function',
) => new ContractMethodDescriptorModel({ name, parameters, returnType });

export const contractEventModel = (
  parameters: readonly ContractParameterDeclarationModel[] = [contractParamModel.boolean],
  name = 'event',
) => new ContractEventModel({ name, parameters });

export const contractAbiModel = (
  methods: readonly ContractMethodDescriptorModel[] = [contractMethodDescriptorModel()],
  events: readonly ContractEventModel[] = [contractEventModel()],
  entryPoint: ContractMethodDescriptorModel = contractMethodDescriptorModel(),
  hash = common.bufferToUInt160(Buffer.alloc(20, 1)),
) => new ContractABIModel({ hash, entryPoint, methods, events });

export const contractGroupModel = (
  publicKey: ECPoint = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY),
  signature: SignatureString = 'ccaab040cc25021c91567b75db4778853441869157b8f6aad960cdcf1069812480027a528ca9b98e2205027de20696f848cf81824eeb7af1d5110870870ceb67',
) => new ContractGroupModel({ publicKey, signature });

export const contractPermissionDescriptorModel = (hashOrGroupType: 'uint160' | 'ecpoint' | undefined) => {
  let hashOrGroup: UInt160 | ECPoint | undefined;
  if (hashOrGroupType === 'uint160') {
    hashOrGroup = common.bufferToUInt160(Buffer.alloc(20, 1));
  } else if (hashOrGroupType === 'ecpoint') {
    hashOrGroup = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY);
  }

  return new ContractPermissionDescriptorModel({ hashOrGroup });
};

export const contractPermissionsModel = (
  hashOrGroupType: 'uint160' | 'ecpoint' | undefined,
  methods: readonly string[] = [],
) => new ContractPermissionsModel({ contract: contractPermissionDescriptorModel(hashOrGroupType), methods });

export const contractManifestModel = (
  groups: readonly ContractGroupModel[] = [contractGroupModel()],
  features: ContractPropertyStateModel = ContractPropertyStateModel.HasStoragePayable,
  abi: ContractABIModel = contractAbiModel(),
  permissions: readonly ContractPermissionsModel[] = [contractPermissionsModel('uint160', ['method1'])],
  trusts: readonly UInt160[] = [common.bufferToUInt160(Buffer.alloc(20, 1))],
  safeMethods: readonly string[] = ['method1', 'method2'],
) => new ContractManifestModel({ groups, features, abi, permissions, trusts, safeMethods });

export const contractModel = (
  script: Buffer = Buffer.alloc(25),
  manifest: ContractManifestModel = contractManifestModel(),
) => new ContractModel({ script, manifest });
