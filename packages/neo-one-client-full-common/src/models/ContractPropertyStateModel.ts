import { InvalidContractPropertyStateError } from '../errors';

export enum ContractPropertyStateModel {
  NoProperty = 0x00,
  HasStorage = 0x01,
  Payable = 0x04,
  HasStoragePayable = 0x05,
}

// tslint:disable-next-line variable-name
export const HasStorage = new Set([
  ContractPropertyStateModel.HasStorage,
  ContractPropertyStateModel.HasStoragePayable,
]);

// tslint:disable-next-line variable-name
export const HasPayable = new Set([ContractPropertyStateModel.Payable, ContractPropertyStateModel.HasStoragePayable]);

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
  payable,
}: {
  readonly hasStorage: boolean;
  readonly payable: boolean;
}): ContractPropertyStateModel => {
  if (hasStorage && payable) {
    return ContractPropertyStateModel.HasStoragePayable;
  }

  if (hasStorage) {
    return ContractPropertyStateModel.HasStorage;
  }

  if (payable) {
    return ContractPropertyStateModel.Payable;
  }

  return ContractPropertyStateModel.NoProperty;
};
