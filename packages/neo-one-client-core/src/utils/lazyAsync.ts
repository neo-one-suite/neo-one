export function lazyAsync<Input, Value>(getValue: (input: Input) => Promise<Value>): (input: Input) => Promise<Value> {
  let valuePromise: Promise<Value> | undefined;

  return async (input) => {
    if (valuePromise === undefined) {
      valuePromise = getValue(input);
    }

    return valuePromise;
  };
}
