import { common, ECPoint, UInt160 } from '@neo-one/client-common';
import { constants } from '@neo-one/utils';
import {
  Contract,
  ContractABI,
  ContractABIAdd,
  ContractAdd,
  ContractEvent,
  ContractEventAdd,
  ContractGroup,
  ContractGroupAdd,
  ContractManifest,
  ContractManifestAdd,
  ContractMethodDescriptor,
  ContractMethodDescriptorAdd,
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

export const createContractEvent = ({
  parameters = [contractParamDeclaration.boolean],
  name = 'event',
}: Partial<ContractEventAdd> = {}) =>
  new ContractEvent({
    name,
    parameters,
  });

export const createContractMethodDescriptor = ({
  parameters = [contractParamDeclaration.boolean],
  returnType = ContractParameterType.Void,
  name = 'event',
}: Partial<ContractMethodDescriptorAdd> = {}) =>
  new ContractMethodDescriptor({
    name,
    parameters,
    returnType,
  });

export const createContractAbi = ({
  methods = [createContractMethodDescriptor()],
  events = [createContractEvent()],
  entryPoint = createContractMethodDescriptor(),
  hash = common.bufferToUInt160(Buffer.alloc(20, 1)),
}: Partial<ContractABIAdd> = {}) => new ContractABI({ hash, entryPoint, methods, events });

export const createContractGroup = ({
  publicKey = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY),
  signature = 'ccaab040cc25021c91567b75db4778853441869157b8f6aad960cdcf1069812480027a528ca9b98e2205027de20696f848cf81824eeb7af1d5110870870ceb67',
}: Partial<ContractGroupAdd> = {}) => new ContractGroup({ publicKey, signature });

export const createContractPermissionDescriptor = ({
  hashOrGroupType,
}: {
  readonly hashOrGroupType: 'uint160' | 'ecpoint' | undefined;
}) => {
  let hashOrGroup: UInt160 | ECPoint | undefined;
  if (hashOrGroupType === 'uint160') {
    hashOrGroup = common.bufferToUInt160(Buffer.alloc(20, 1));
  } else if (hashOrGroupType === 'ecpoint') {
    hashOrGroup = common.stringToECPoint(constants.PRIVATE_NET_PUBLIC_KEY);
  }

  return new ContractPermissionDescriptor({ hashOrGroup });
};

export const createContractPermissions = ({
  hashOrGroupType,
  methods = [],
}: {
  readonly hashOrGroupType: 'uint160' | 'ecpoint' | undefined;
  readonly methods: readonly string[];
}) => new ContractPermissions({ contract: createContractPermissionDescriptor({ hashOrGroupType }), methods });

export const createContractManifest = ({
  groups = [createContractGroup()],
  features = ContractPropertyState.HasStoragePayable,
  abi = createContractAbi(),
  permissions = [createContractPermissions({ hashOrGroupType: 'uint160', methods: ['method1'] })],
  trusts = [common.bufferToUInt160(Buffer.alloc(20, 1))],
  safeMethods = ['method1', 'method2'],
}: Partial<ContractManifestAdd> = {}) =>
  new ContractManifest({ groups, features, abi, permissions, trusts, safeMethods });

export const createContract = ({
  script = Buffer.alloc(25),
  manifest = createContractManifest(),
}: Partial<ContractAdd> = {}) => new Contract({ script, manifest });
