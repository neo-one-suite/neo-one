/* @flow */
// flowlint untyped-type-import:off
import type BloomFilter from 'bloom-filter';

import type { NetworkAddress } from './payload';

export type PeerData = {|
  nonce: number,
  startHeight: number,
  bloomFilter: ?BloomFilter,
  address?: NetworkAddress,
|};
