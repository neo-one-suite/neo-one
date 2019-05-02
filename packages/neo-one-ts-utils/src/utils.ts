export function getValueOrUndefined<T>(value: T | null | undefined): T | undefined {
  return value == undefined ? undefined : value;
}

export function throwIfNullOrUndefined<T>(value: T | null | undefined, name: string): T {
  if (value == undefined) {
    throw new Error(`Expected a ${name}`);
  }

  return value;
}

// tslint:disable-next-line readonly-array
export function getArray<T>(value: readonly T[] | null | undefined): readonly T[] {
  const val = getValueOrUndefined(value);

  return val === undefined ? [] : val;
}

export function notNull<T>(value: T | null | undefined): value is T {
  return value != undefined;
}
