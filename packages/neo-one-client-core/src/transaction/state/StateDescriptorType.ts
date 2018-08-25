import { makeErrorWithCode } from '@neo-one/utils';

export enum StateDescriptorType {
  Account = 0x40,
  Validator = 0x48,
}

export const InvalidStateDescriptorTypeError = makeErrorWithCode(
  'INVALID_STATE_DESCRIPTOR_TYPE',
  (stateDescriptorType: number) => `Expected StateDescriptorType, found: ${stateDescriptorType.toString(16)}`,
);

const isStateDescriptorType = (value: number): value is StateDescriptorType =>
  // tslint:disable-next-line strict-type-predicates
  StateDescriptorType[value] !== undefined;

export const assertStateDescriptorType = (value: number): StateDescriptorType => {
  if (isStateDescriptorType(value)) {
    return value;
  }
  throw new InvalidStateDescriptorTypeError(value);
};
