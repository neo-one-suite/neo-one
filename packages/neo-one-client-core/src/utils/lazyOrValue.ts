type Settings<Value> =
  | { readonly type: 'lazy'; readonly getValue: () => Value }
  | { readonly type: 'evaluated'; readonly value: Value };

export function lazyOrValue<Value>(getValue: (() => Value) | Value): () => Value {
  let settings: Settings<Value> =
    typeof getValue === 'function' ? { type: 'lazy', getValue } : { type: 'evaluated', value: getValue };

  return () => {
    if (settings.type === 'lazy') {
      settings = { type: 'evaluated', value: settings.getValue() };
    }

    return settings.value;
  };
}
