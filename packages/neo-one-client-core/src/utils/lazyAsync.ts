export function lazyAsync<Input, Value>(
  getValue: (input: Input) => Promise<Value>,
): (input: Input) => Promise<Value> {
  let valuePromise: Promise<Value> | undefined;
  return (input) => {
    if (valuePromise == null) {
      valuePromise = getValue(input);
    }

    return valuePromise;
  };
}
