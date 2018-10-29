import { makeErrorWithCode } from '@neo-one/utils';
import { common, PrivateKey } from './common';
import { ContractParameter } from './types';

/* istanbul ignore next */
export const UnknownOpError = makeErrorWithCode('UNKNOWN_OP', (byteCode: string) => `Unknown op: ${byteCode}`);
export const InvalidContractParameterError = makeErrorWithCode(
  'INVALID_CONTRACT_PARAMETER',
  (parameter: ContractParameter, expected: ReadonlyArray<ContractParameter['type']>) =>
    `Expected one of ${JSON.stringify(expected)} ` + `ContractParameterTypes, found ${parameter.type}`,
);
export const Base58CheckError = makeErrorWithCode(
  'BASE_58_CHECK',
  (value: string) => `Base58 Check Decode Error on decoding: ${value}`,
);
export const InvalidAddressError = makeErrorWithCode(
  'INVALID_ADDRESS',
  (address: string) => `Invalid Address: ${address}`,
);
export const TooManyPublicKeysError = makeErrorWithCode(
  'TOO_MANY_PUBLIC_KEYS',
  (amount: number) => `Too many public keys. Found: ${amount}, Max: 1024`,
);
export const InvalidNumberOfKeysError = makeErrorWithCode(
  'INVALID_NUMBER_OF_KEYS',
  (m: number, amount: number) =>
    `invalid number of keys. Found: ${m} keys, must be between 1 and ${amount} (number of public keys).`,
);
/* istanbul ignore next */
export const InvalidPrivateKeyError = makeErrorWithCode(
  'INVALID_PRIVATE_KEY',
  (privateKey: PrivateKey) => `Invalid Private Key, found: ${common.privateKeyToString(privateKey)}`,
);
export const InvalidSignatureError = makeErrorWithCode(
  'INVALID_SIGNATURE',
  (length: number) => `Invalid Signature length. Found: ${length}, Max: 64`,
);
export const InvalidSysCallError = makeErrorWithCode(
  'INVALID_SYS_CALL_NAME',
  (value: string) => `Expected sys call name, found: ${value}`,
);
export const InvalidVMStateError = makeErrorWithCode(
  'INVALID_VM_STATE',
  (state: number) => `Invalid VM State: ${state}`,
);
/* istanbul ignore next */
export const InvalidParamError = makeErrorWithCode(
  'INVALID_PARAM',
  (paramType?: string) => `Invalid Param${paramType === undefined ? '.' : `: ${paramType}`}`,
);
export const InvalidAssetTypeJSONError = makeErrorWithCode(
  'INVALID_ASSET_TYPE_JSON',
  (type: string) => `Invalid AssetType: ${type}`,
);
export const InvalidAssetTypeError = makeErrorWithCode(
  'INVALID_ASSET_TYPE',
  (assetType: number) => `Expected asset type, found: ${assetType.toString(16)}`,
);
export const InvalidStateDescriptorTypeError = makeErrorWithCode(
  'INVALID_STATE_DESCRIPTOR_TYPE',
  (stateDescriptorType: number) => `Expected StateDescriptorType, found: ${stateDescriptorType.toString(16)}`,
);
export const InvalidContractParameterTypeJSONError = makeErrorWithCode(
  'INVALID_CONTRACT_PARAMETER_TYPE_JSON',
  (value: string) => `Invalid ContractParameterType: ${value}`,
);
export const InvalidContractParameterTypeError = makeErrorWithCode(
  'INVALID_CONTRACT_PARAMETER_TYPE',
  (contractParameterType: number) => `Expected contract parameter type, found: ${contractParameterType.toString(16)}`,
);
export const InvalidAttributeUsageError = makeErrorWithCode(
  'INVALID_ATTRIBUTE_USAGE',
  (transactionAttributeUsage: number) =>
    `Expected transaction attribute usage, found: ${transactionAttributeUsage.toString(16)}`,
);
export const InvalidAttributeUsageJSONError = makeErrorWithCode(
  'INVALID_ATTRIBUTE_USAGE_JSON',
  (transactionAttributeUsage: string) => `Expected transaction attribute usage, found: ${transactionAttributeUsage}`,
);
export const InvalidTransactionTypeError = makeErrorWithCode(
  'INVALID_TRANSACTION_TYPE',
  (transactionType: number) => `Expected transaction type, found: ${transactionType.toString(16)}`,
);
export const InvalidVMByteCodeError = makeErrorWithCode(
  'INVALID_VM_OP_CODE',
  (value: number) => `Expected VM OpCode, received: ${value}}`,
);
export const InvalidSignaturesError = makeErrorWithCode(
  'INVALID_SIGNATURES',
  (m: number, value: number) => `Expected ${m} unique signatures, found: ${value}.`,
);
