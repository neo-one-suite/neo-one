type Settings<Value> =
  | { type: 'lazy'; getValue: () => Value }
  | { type: 'evaluated'; value: Value };

export function lazyOrValue<Value>(
  getValue: (() => Value) | Value,
): () => Value {
  let settings: Settings<Value> =
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
