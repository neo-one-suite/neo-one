import { InvalidContractFeatureError } from '../../errors';

export enum ContractFeaturesModel {
  NoProperty = 0x00,
  HasStorage = 0x01,
  Payable = 0x04,
  HasStoragePayable = 0x05,
}

// tslint:disable-next-line variable-name
export const HasStorage = new Set([ContractFeaturesModel.HasStorage, ContractFeaturesModel.HasStoragePayable]);

// tslint:disable-next-line variable-name
export const HasPayable = new Set([ContractFeaturesModel.Payable, ContractFeaturesModel.HasStoragePayable]);

const isContractFeature = (value: number): value is ContractFeaturesModel =>
  // tslint:disable-next-line strict-type-predicates
  ContractFeaturesModel[value] !== undefined;

export const assertContractFeature = (value: number): ContractFeaturesModel => {
  if (isContractFeature(value)) {
    return value;
  }

  throw new InvalidContractFeatureError(value);
};

export const getContractProperties = ({
  hasStorage,
  payable,
}: {
  readonly hasStorage: boolean;
  readonly payable: boolean;
}): ContractFeaturesModel => {
  if (hasStorage && payable) {
    return ContractFeaturesModel.HasStoragePayable;
  }

  if (hasStorage) {
    return ContractFeaturesModel.HasStorage;
  }

  if (payable) {
    return ContractFeaturesModel.Payable;
  }

  return ContractFeaturesModel.NoProperty;
};
