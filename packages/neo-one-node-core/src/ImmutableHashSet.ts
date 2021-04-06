export interface ImmutableHashSet<T> {
  readonly contains: (item: T) => boolean;
}

export interface ImmutableHashSetBuilder<T> {
  readonly add: (item: T) => void;
  readonly unionWith: (items: readonly T[]) => void;
  readonly toImmutable: () => ImmutableHashSet<T>;
}
