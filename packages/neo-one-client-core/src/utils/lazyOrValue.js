/* @flow */
export default function<Value>(getValue: (() => Value) | Value): () => Value {
  let settings =
    typeof getValue === 'function'
      ? { type: 'lazy', getValue }
      : { type: 'evaluated', value: getValue };
  return () => {
    if (settings.type === 'lazy') {
      settings = { type: 'evaluated', value: settings.getValue() };
    }

    return settings.value;
  };
}
