type childTypeInternal = string | number;

interface ChildInterfaceInternal {
  readonly child: childTypeInternal;
}

export type childType = childTypeInternal | ReadonlyArray<childTypeInternal>;

export interface ChildInterface {
  readonly child: ChildInterfaceInternal;
}

enum childEnumInternal {
  one,
  two,
}

export const getEnumValue = (value: number) => childEnumInternal[value];

export enum childEnum {
  two,
  three,
}
