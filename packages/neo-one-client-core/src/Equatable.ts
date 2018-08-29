export type Equals = (other: {}) => boolean;
export interface Equatable {
  readonly equals: Equals;
}

export type ToKeyString = () => string;
export interface EquatableKey extends Equatable {
  readonly toKeyString: ToKeyString;
}
