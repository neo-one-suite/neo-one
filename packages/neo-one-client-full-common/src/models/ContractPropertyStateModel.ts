import { InvalidContractPropertyStateError } from '../errors';

export enum ContractPropertyStateModel {
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
  ContractPropertyStateModel.HasStorage,
  ContractPropertyStateModel.HasStorageDynamicInvoke,
  ContractPropertyStateModel.HasStoragePayable,
  ContractPropertyStateModel.HasStorageDynamicInvokePayable,
]);

// tslint:disable-next-line variable-name
export const HasDynamicInvoke = new Set([
  ContractPropertyStateModel.HasDynamicInvoke,
  ContractPropertyStateModel.HasStorageDynamicInvoke,
  ContractPropertyStateModel.HasDynamicInvokePayable,
  ContractPropertyStateModel.HasStorageDynamicInvokePayable,
]);

// tslint:disable-next-line variable-name
export const HasPayable = new Set([
  ContractPropertyStateModel.Payable,
  ContractPropertyStateModel.HasStoragePayable,
  ContractPropertyStateModel.HasDynamicInvokePayable,
  ContractPropertyStateModel.HasStorageDynamicInvokePayable,
]);

const isContractPropertyState = (value: number): value is ContractPropertyStateModel =>
  // tslint:disable-next-line strict-type-predicates
  ContractPropertyStateModel[value] !== undefined;

export const assertContractPropertyState = (value: number): ContractPropertyStateModel => {
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
}): ContractPropertyStateModel => {
  if (hasStorage && hasDynamicInvoke && payable) {
    return ContractPropertyStateModel.HasStorageDynamicInvokePayable;
  }

  if (hasStorage && hasDynamicInvoke) {
    return ContractPropertyStateModel.HasStorageDynamicInvoke;
  }

  if (hasStorage && payable) {
    return ContractPropertyStateModel.HasStoragePayable;
  }

  if (hasDynamicInvoke && payable) {
    return ContractPropertyStateModel.HasDynamicInvokePayable;
  }

  if (hasDynamicInvoke) {
    return ContractPropertyStateModel.HasDynamicInvoke;
  }

  if (hasStorage) {
    return ContractPropertyStateModel.HasStorage;
  }

  if (payable) {
    return ContractPropertyStateModel.Payable;
  }

  return ContractPropertyStateModel.NoProperty;
};
