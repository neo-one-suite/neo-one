import { InvalidStateDescriptorTypeError } from '../errors';

export enum StateDescriptorTypeModel {
  Account = 0x40,
  Validator = 0x48,
}

const isStateDescriptorType = (value: number): value is StateDescriptorTypeModel =>
  // tslint:disable-next-line strict-type-predicates
  StateDescriptorTypeModel[value] !== undefined;

export const assertStateDescriptorType = (value: number): StateDescriptorTypeModel => {
  if (isStateDescriptorType(value)) {
    return value;
  }
  throw new InvalidStateDescriptorTypeError(value);
};
