import { common, ContractParameterTypeModel, ECPoint, SignatureString, UInt160 } from '@neo-one/client-common';
import { constants } from '@neo-one/utils';
import {
  ContractABIModel,
  ContractEventDescriptorModel,
  ContractFeaturesModel,
  ContractGroupModel,
  ContractManifestModel,
  ContractMethodDescriptorModel,
  ContractParameterDefinitionModel,
  ContractPermissionDescriptorModel,
  ContractPermissionModel,
  ContractStateModel,
} from '../models';

export const contractParamDefinitionModel = {
  any: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.Any,
    name: 'param',
  }),
  boolean: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.Boolean,
    name: 'param',
  }),
  byteArray: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.ByteArray,
    name: 'param',
  }),
  hash160: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.Hash160,
    name: 'param',
  }),
  hash256: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.Hash256,
    name: 'param',
  }),
  array: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.Array,
    name: 'param',
  }),
  integer: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.Integer,
    name: 'param',
  }),
  interopInterface: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.InteropInterface,
    name: 'param',
  }),
  map: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.Map,
    name: 'param',
  }),
  publicKey: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.PublicKey,
    name: 'param',
  }),
  signature: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.Signature,
    name: 'param',
  }),
  string: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.String,
    name: 'param',
  }),
  void: new ContractParameterDefinitionModel({
    type: ContractParameterTypeModel.Void,
    name: 'param',
  }),
};

export const contractMethodDescriptorModel = (
  parameters: readonly ContractParameterDefinitionModel[] = [contractParamDefinitionModel.boolean],
  returnType: ContractParameterTypeModel = ContractParameterTypeModel.Void,
  name = 'function',
  offset = 0,
) => new ContractMethodDescriptorModel({ name, parameters, returnType, offset });

export const contractEventDescriptorModel = (
  parameters: readonly ContractParameterDefinitionModel[] = [contractParamDefinitionModel.boolean],
  name = 'event',
) => new ContractEventDescriptorModel({ name, parameters });

export const contractAbiModel = (
  methods: readonly ContractMethodDescriptorModel[] = [contractMethodDescriptorModel()],
  events: readonly ContractEventDescriptorModel[] = [contractEventDescriptorModel()],
  hash = common.bufferToUInt160(Buffer.alloc(20, 1)),
) => new ContractABIModel({ hash, methods, events });

export const contractGroupModel = (
  publicKey: ECPoint = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY),
  signature: Buffer = Buffer.from(
    'ccaab040cc25021c91567b75db4778853441869157b8f6aad960cdcf1069812480027a528ca9b98e2205027de20696f848cf81824eeb7af1d5110870870ceb67',
    'hex',
  ),
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

export const contractPermissionModel = (
  hashOrGroupType: 'uint160' | 'ecpoint' | undefined,
  methods: readonly string[] = [],
) => new ContractPermissionModel({ contract: contractPermissionDescriptorModel(hashOrGroupType), methods });

export const contractManifestModel = (
  groups: readonly ContractGroupModel[] = [contractGroupModel()],
  features: ContractFeaturesModel = ContractFeaturesModel.HasStoragePayable,
  abi: ContractABIModel = contractAbiModel(),
  permissions: readonly ContractPermissionModel[] = [contractPermissionModel('uint160', ['method1'])],
  trusts: readonly UInt160[] = [common.bufferToUInt160(Buffer.alloc(20, 1))],
  safeMethods: readonly string[] = ['method1', 'method2'],
  supportedStandards: readonly string[] = [],
) => new ContractManifestModel({ groups, features, supportedStandards, abi, permissions, trusts, safeMethods });

export const contractModel = (
  id = 1,
  script: Buffer = Buffer.alloc(25),
  manifest: ContractManifestModel = contractManifestModel(),
) => new ContractStateModel({ id, script, manifest });
