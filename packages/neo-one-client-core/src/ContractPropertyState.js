/* @flow */
import { CustomError } from '@neo-one/utils';

export const CONTRACT_PROPERTY_STATE = {
  NO_PROPERTY: 0x00,
  HAS_STORAGE: 0x01,
  HAS_DYNAMIC_INVOKE: 0x02,
  PAYABLE: 0x04,
  HAS_STORAGE_DYNAMIC_INVOKE: 0x03,
  HAS_STORAGE_PAYABLE: 0x05,
  HAS_DYNAMIC_INVOKE_PAYABLE: 0x06,
  HAS_STORAGE_DYNAMIC_INVOKE_PAYABLE: 0x07,
};

export type ContractPropertyState =
  | 0x00
  | 0x01
  | 0x02
  | 0x03
  | 0x04
  | 0x05
  | 0x06
  | 0x07;

export const HAS_STORAGE = (new Set([
  CONTRACT_PROPERTY_STATE.HAS_STORAGE,
  CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE,
  CONTRACT_PROPERTY_STATE.HAS_STORAGE_PAYABLE,
  CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE_PAYABLE,
]): Set<ContractPropertyState>);

export const HAS_DYNAMIC_INVOKE = (new Set([
  CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE,
  CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE,
  CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE_PAYABLE,
  CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE_PAYABLE,
]): Set<ContractPropertyState>);

export const HAS_PAYABLE = (new Set([
  CONTRACT_PROPERTY_STATE.PAYABLE,
  CONTRACT_PROPERTY_STATE.HAS_STORAGE_PAYABLE,
  CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE_PAYABLE,
  CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE_PAYABLE,
]): Set<ContractPropertyState>);

export class InvalidContractPropertyStateError extends CustomError {
  code: string;
  contractParameterType: number;

  constructor(contractParameterType: number) {
    super(
      `Expected contract parameter type, ` +
        `found: ${contractParameterType.toString(16)}`,
    );
    this.contractParameterType = contractParameterType;
    this.code = 'INVALID_CONTRACT_PROPERTY_STATE';
  }
}

export const assertContractPropertyState = (
  value: number,
): ContractPropertyState => {
  switch (value) {
    case CONTRACT_PROPERTY_STATE.NO_PROPERTY:
      return CONTRACT_PROPERTY_STATE.NO_PROPERTY;
    case CONTRACT_PROPERTY_STATE.HAS_STORAGE:
      return CONTRACT_PROPERTY_STATE.HAS_STORAGE;
    case CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE:
      return CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE;
    case CONTRACT_PROPERTY_STATE.PAYABLE:
      return CONTRACT_PROPERTY_STATE.PAYABLE;
    case CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE:
      return CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE;
    case CONTRACT_PROPERTY_STATE.HAS_STORAGE_PAYABLE:
      return CONTRACT_PROPERTY_STATE.HAS_STORAGE_PAYABLE;
    case CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE_PAYABLE:
      return CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE_PAYABLE;
    case CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE_PAYABLE:
      return CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE_PAYABLE;
    default:
      throw new InvalidContractPropertyStateError(value);
  }
};

export const getContractProperties = ({
  hasStorage,
  hasDynamicInvoke,
  payable,
}: {|
  hasStorage: boolean,
  hasDynamicInvoke: boolean,
  payable: boolean,
|}): ContractPropertyState => {
  if (hasStorage && hasDynamicInvoke && payable) {
    return CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE_PAYABLE;
  }

  if (hasStorage && hasDynamicInvoke) {
    return CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE;
  }

  if (hasStorage && payable) {
    return CONTRACT_PROPERTY_STATE.HAS_STORAGE_PAYABLE;
  }

  if (hasDynamicInvoke && payable) {
    return CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE_PAYABLE;
  }

  if (hasDynamicInvoke) {
    return CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE;
  }

  if (hasStorage) {
    return CONTRACT_PROPERTY_STATE.HAS_STORAGE;
  }

  if (payable) {
    return CONTRACT_PROPERTY_STATE.PAYABLE;
  }

  return CONTRACT_PROPERTY_STATE.NO_PROPERTY;
};
