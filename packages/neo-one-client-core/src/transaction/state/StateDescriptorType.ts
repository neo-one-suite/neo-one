import { CustomError } from '@neo-one/utils';

export enum StateDescriptorType {
  Account = 0x40,
  Validator = 0x48,
}

export class InvalidStateDescriptorTypeError extends CustomError {
  public readonly stateDescriptorType: number;
  public readonly code: string;

  constructor(stateDescriptorType: number) {
    super(
      `Expected state descriptor type, found: ${stateDescriptorType.toString(
        16,
      )}`,
    );

    this.stateDescriptorType = stateDescriptorType;
    this.code = 'INVALID_STATE_DESCRIPTOR_TYPE';
  }
}

const isStateDescriptorType = (value: number): value is StateDescriptorType =>
  StateDescriptorType[value] != null;

export const assertStateDescriptorType = (
  value: number,
): StateDescriptorType => {
  if (isStateDescriptorType(value)) {
    return value;
  }
  throw new InvalidStateDescriptorTypeError(value);
};
