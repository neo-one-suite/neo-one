// tslint:disable-next-line:match-default-export-name
import BloomFilter from 'bloom-filter';
import { NetworkAddress } from './payload';

export interface PeerData {
  readonly nonce: number;
  readonly startHeight: number;
  mutableBloomFilter: BloomFilter | undefined;
  readonly address?: NetworkAddress;
  readonly listenPort: number;
}
