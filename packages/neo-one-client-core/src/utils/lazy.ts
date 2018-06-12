export function lazy<Value>(getValue: () => Value): () => Value {
  let value: Value | undefined;
  return () => {
    if (value == null) {
      value = getValue();
    }

    return value;
  };
}
