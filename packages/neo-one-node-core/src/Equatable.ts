export type Equals<T = {}> = (other: T) => boolean;
export interface Equatable<T = {}> {
  readonly equals: Equals<T>;
}

export type ToKeyString = () => string;
export interface EquatableKey<T = {}> extends Equatable<T> {
  readonly toKeyString: ToKeyString;
}
