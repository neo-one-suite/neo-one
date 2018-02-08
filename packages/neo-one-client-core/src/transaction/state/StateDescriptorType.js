/* @flow */
import { CustomError } from '@neo-one/utils';

export const STATE_DESCRIPTOR_TYPE = {
  ACCOUNT: 0x40,
  VALIDATOR: 0x48,
};

export class InvalidStateDescriptorTypeError extends CustomError {
  stateDescriptorType: number;
  code: string;

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

export type StateDescriptorType = 0x40 | 0x48;

export const assertStateDescriptorType = (
  value: number,
): StateDescriptorType => {
  switch (value) {
    case 0x40: // Account
      return 0x40;
    case 0x48: // Validator
      return 0x48;
    default:
      throw new InvalidStateDescriptorTypeError(value);
  }
};
