// tslint:disable no-loop-statement
import { Input } from './Input';

export const hasDuplicateInputs = (inputs: readonly Input[]): boolean => {
  const inputKeys = new Set(inputs.map((input) => input.toKeyString()));

  return inputs.length !== inputKeys.size;
};

export const hasIntersectingInputs = (a: readonly Input[], b: readonly Input[]): boolean => {
  const inputsA = new Set(a.map((input) => input.toKeyString()));

  return b.some((input) => inputsA.has(input.toKeyString()));
};
