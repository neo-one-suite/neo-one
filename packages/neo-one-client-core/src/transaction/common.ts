import { Input } from './Input';

export const hasDuplicateInputs = (inputs: Input[]): boolean => {
  for (let i = 1; i < inputs.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (inputs[i].equals(inputs[j])) {
        return true;
      }
    }
  }

  return false;
};

export const hasIntersectingInputs = (a: Input[], b: Input[]): boolean => {
  for (const inputA of a) {
    for (const inputB of b) {
      if (inputA.equals(inputB)) {
        return true;
      }
    }
  }

  return false;
};
