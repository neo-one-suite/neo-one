/* @flow */
export default function<Value>(getValue: () => Value): () => Value {
  let value;
  return () => {
    if (value == null) {
      value = getValue();
    }

    return value;
  };
}
