// tslint:disable no-loop-statement
import { Input } from './Input';

export const hasDuplicateInputs = (inputs: ReadonlyArray<Input>): boolean => {
  for (let i = 1; i < inputs.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (inputs[i].equals(inputs[j])) {
        return true;
      }
    }
  }

  return false;
};

export const hasIntersectingInputs = (a: ReadonlyArray<Input>, b: ReadonlyArray<Input>): boolean => {
  for (const inputA of a) {
    for (const inputB of b) {
      if (inputA.equals(inputB)) {
        return true;
      }
    }
  }

  return false;
};
