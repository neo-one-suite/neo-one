export type Equals = (other: {}) => boolean;
export interface Equatable {
  readonly equals: Equals;
}
