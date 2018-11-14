import { ConnectedPeer } from './ConnectedPeer';
import { Peer } from './Peer';

export type NetworkEventMessage<Message, PeerData> =
  | {
      readonly event: 'PEER_CONNECT_SUCCESS';
      readonly connectedPeer: ConnectedPeer<Message, PeerData>;
    }
  | {
      readonly event: 'PEER_CLOSED';
      readonly peer: Peer<Message> | ConnectedPeer<Message, PeerData>;
    };

export type OnNetworkEvent<Message, PeerData> = (event: NetworkEventMessage<Message, PeerData>) => void;
