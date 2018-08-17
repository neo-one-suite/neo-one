export const createMemoized = () => {
  // tslint:disable-next-line no-any readonly-keyword
  const caches: { [key: string]: Map<any, any> } = {};

  return <K, V>(cacheName: string, name: K, getValue: () => V): V => {
    // tslint:disable-next-line no-any
    let cache = caches[cacheName] as Map<any, any> | undefined;
    if (cache === undefined) {
      cache = new Map();
      // tslint:disable-next-line no-object-mutation
      caches[cacheName] = cache;
    }

    let value = cache.get(name);
    if (value === undefined) {
      value = getValue();
      cache.set(name, value);
    }

    return value;
  };
};
