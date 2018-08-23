import { makeErrorWithCode } from '@neo-one/utils';

export enum ContractPropertyState {
  NoProperty = 0x00,
  HasStorage = 0x01,
  HasDynamicInvoke = 0x02,
  Payable = 0x04,
  HasStorageDynamicInvoke = 0x03,
  HasStoragePayable = 0x05,
  HasDynamicInvokePayable = 0x06,
  HasStorageDynamicInvokePayable = 0x07,
}

// tslint:disable-next-line variable-name
export const HasStorage = new Set([
  ContractPropertyState.HasStorage,
  ContractPropertyState.HasStorageDynamicInvoke,
  ContractPropertyState.HasStoragePayable,
  ContractPropertyState.HasStorageDynamicInvokePayable,
]);

// tslint:disable-next-line variable-name
export const HasDynamicInvoke = new Set([
  ContractPropertyState.HasDynamicInvoke,
  ContractPropertyState.HasStorageDynamicInvoke,
  ContractPropertyState.HasDynamicInvokePayable,
  ContractPropertyState.HasStorageDynamicInvokePayable,
]);

// tslint:disable-next-line variable-name
export const HasPayable = new Set([
  ContractPropertyState.Payable,
  ContractPropertyState.HasStoragePayable,
  ContractPropertyState.HasDynamicInvokePayable,
  ContractPropertyState.HasStorageDynamicInvokePayable,
]);

export const InvalidContractPropertyStateError = makeErrorWithCode(
  'INVALID_ContractPropertyState',
  (contractParameterType: number) =>
    `Expected contract parameter type, ` + `found: ${contractParameterType.toString(16)}`,
);

const isContractPropertyState = (value: number): value is ContractPropertyState =>
  // tslint:disable-next-line strict-type-predicates
  ContractPropertyState[value] !== undefined;

export const assertContractPropertyState = (value: number): ContractPropertyState => {
  if (isContractPropertyState(value)) {
    return value;
  }

  throw new InvalidContractPropertyStateError(value);
};

export const getContractProperties = ({
  hasStorage,
  hasDynamicInvoke,
  payable,
}: {
  readonly hasStorage: boolean;
  readonly hasDynamicInvoke: boolean;
  readonly payable: boolean;
}): ContractPropertyState => {
  if (hasStorage && hasDynamicInvoke && payable) {
    return ContractPropertyState.HasStorageDynamicInvokePayable;
  }

  if (hasStorage && hasDynamicInvoke) {
    return ContractPropertyState.HasStorageDynamicInvoke;
  }

  if (hasStorage && payable) {
    return ContractPropertyState.HasStoragePayable;
  }

  if (hasDynamicInvoke && payable) {
    return ContractPropertyState.HasDynamicInvokePayable;
  }

  if (hasDynamicInvoke) {
    return ContractPropertyState.HasDynamicInvoke;
  }

  if (hasStorage) {
    return ContractPropertyState.HasStorage;
  }

  if (payable) {
    return ContractPropertyState.Payable;
  }

  return ContractPropertyState.NoProperty;
};
