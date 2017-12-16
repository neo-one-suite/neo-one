/* @flow */
function keys<K, V>(obj: { [key: K]: V }): Array<K> {
  return (Object.keys(obj): $FlowFixMe);
}

function values<K, V>(obj: { [key: K]: V }): Array<V> {
  return (Object.values(obj): $FlowFixMe);
}

function entries<K, V>(obj: { [key: K]: V }): Array<[K, V]> {
  return (Object.entries(obj): $FlowFixMe);
}

const nowSeconds = (): number => Math.round(Date.now() / 1000);

function nullthrows<T>(value: ?T): T {
  if (value == null) {
    throw new Error('Unexpected null');
  }

  return value;
}

export default {
  keys,
  values,
  entries,
  nowSeconds,
  nullthrows,
};
