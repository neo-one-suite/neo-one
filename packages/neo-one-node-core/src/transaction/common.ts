// tslint:disable no-loop-statement
import { Input } from './Input';

export const hasDuplicateInputs = (inputs: ReadonlyArray<Input>): boolean => {
  const inputKeys = new Set(inputs.map((input) => input.toKeyString()));

  return inputs.length !== inputKeys.size;
};

export const hasIntersectingInputs = (a: ReadonlyArray<Input>, b: ReadonlyArray<Input>): boolean => {
  const inputsA = new Set(a.map((input) => input.toKeyString()));

  return b.some((input) => inputsA.has(input.toKeyString()));
};
