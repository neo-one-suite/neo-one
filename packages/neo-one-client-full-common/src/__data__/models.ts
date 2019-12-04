import { common, ContractParameterTypeModel, ECPoint, SignatureString, UInt160 } from '@neo-one/client-common';
import { constants } from '@neo-one/utils';
import {
  ContractABIModel,
  ContractEventModel,
  ContractFunctionModel,
  ContractGroupModel,
  ContractManifestModel,
  ContractModel,
  ContractParameterModel,
  ContractPermissionDescriptorModel,
  ContractPermissionsModel,
  ContractPropertyStateModel,
} from '../models';

export const contractParamModel = {
  boolean: new ContractParameterModel({
    type: ContractParameterTypeModel.Boolean,
    name: 'param',
  }),
  byteArray: new ContractParameterModel({
    type: ContractParameterTypeModel.ByteArray,
    name: 'param',
  }),
  hash160: new ContractParameterModel({
    type: ContractParameterTypeModel.Hash160,
    name: 'param',
  }),
  hash256: new ContractParameterModel({
    type: ContractParameterTypeModel.Hash256,
    name: 'param',
  }),
  array: new ContractParameterModel({
    type: ContractParameterTypeModel.Array,
    name: 'param',
  }),
  integer: new ContractParameterModel({
    type: ContractParameterTypeModel.Integer,
    name: 'param',
  }),
  interopInterface: new ContractParameterModel({
    type: ContractParameterTypeModel.InteropInterface,
    name: 'param',
  }),
  map: new ContractParameterModel({
    type: ContractParameterTypeModel.Map,
    name: 'param',
  }),
  publicKey: new ContractParameterModel({
    type: ContractParameterTypeModel.PublicKey,
    name: 'param',
  }),
  signature: new ContractParameterModel({
    type: ContractParameterTypeModel.Signature,
    name: 'param',
  }),
  string: new ContractParameterModel({
    type: ContractParameterTypeModel.String,
    name: 'param',
  }),
  void: new ContractParameterModel({
    type: ContractParameterTypeModel.Void,
    name: 'param',
  }),
};

export const contractFunctionModel = (
  parameters: readonly ContractParameterModel[] = [contractParamModel.boolean],
  returnType: ContractParameterTypeModel = ContractParameterTypeModel.Void,
  name = 'function',
) => new ContractFunctionModel({ name, parameters, returnType });

export const contractEventModel = (
  parameters: readonly ContractParameterModel[] = [contractParamModel.boolean],
  name = 'event',
) => new ContractEventModel({ name, parameters });

export const contractAbiModel = (
  methods: readonly ContractFunctionModel[] = [contractFunctionModel()],
  events: readonly ContractEventModel[] = [contractEventModel()],
  entryPoint: ContractFunctionModel = contractFunctionModel(),
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
