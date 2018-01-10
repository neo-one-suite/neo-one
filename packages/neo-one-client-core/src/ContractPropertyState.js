/* @flow */
import { CustomError } from '@neo-one/utils';

export const CONTRACT_PROPERTY_STATE = {
  NO_PROPERTY: 0x00,
  HAS_STORAGE: 0x01,
  HAS_DYNAMIC_INVOKE: 0x02,
  HAS_STORAGE_DYNAMIC_INVOKE: 0x03,
};

export type ContractPropertyState = 0x00 | 0x01 | 0x02 | 0x03;

export const HAS_STORAGE = (new Set([
  CONTRACT_PROPERTY_STATE.HAS_STORAGE,
  CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE,
]): Set<ContractPropertyState>);

export const HAS_DYNAMIC_INVOKE = (new Set([
  CONTRACT_PROPERTY_STATE.HAS_DYNAMIC_INVOKE,
  CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE,
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
    case CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE:
      return CONTRACT_PROPERTY_STATE.HAS_STORAGE_DYNAMIC_INVOKE;
    default:
      throw new InvalidContractPropertyStateError(value);
  }
};
