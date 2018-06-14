export function lazy<Value>(getValue: () => Value): () => Value {
  let value: Value | undefined;

  return () => {
    if (value === undefined) {
      value = getValue();
    }

    return value;
  };
}
