import {
  ImmutableHashSet as ImmutableHashSetNode,
  ImmutableHashSetBuilder as ImmutableHashSetBuilderNode,
} from '@neo-one/node-core';

export class ImmutableHashSet<T> implements ImmutableHashSetNode<T> {
  private readonly set: Set<T>;
  public constructor(setIn: Set<T>) {
    this.set = setIn;
  }

  public contains(item: T) {
    return this.set.has(item);
  }
}

export class ImmutableHashSetBuilder<T> implements ImmutableHashSetBuilderNode<T> {
  private readonly internalSet: Set<T>;
  public constructor() {
    this.internalSet = new Set<T>();
  }

  public add(item: T) {
    this.internalSet.add(item);
  }

  public unionWith(items: readonly T[]) {
    items.forEach((item) => {
      this.internalSet.add(item);
    });
  }

  public toImmutable() {
    return new ImmutableHashSet(this.internalSet);
  }
}
