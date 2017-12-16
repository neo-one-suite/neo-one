/* @flow */
export default function<Input, Value>(
  getValue: (input: Input) => Promise<Value>,
): (input: Input) => Promise<Value> {
  let valuePromise;
  return input => {
    if (valuePromise == null) {
      valuePromise = getValue(input);
    }

    return valuePromise;
  };
}
