/* @flow */
export type Equals = (other: mixed) => boolean;
export interface Equatable {
  +equals: Equals;
}
