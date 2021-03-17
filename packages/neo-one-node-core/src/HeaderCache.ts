import { Header } from './Header';

export interface HeaderCache {
  readonly last: Header | undefined;
  readonly isFull: boolean;
  readonly add: (header: Header) => void;
  readonly tryRemoveFirst: () => Header | undefined;
  readonly tryGet: (idx: number) => Header | undefined;
}
