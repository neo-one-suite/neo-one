/* @flow */
import type ConnectedPeer from './ConnectedPeer';
import type Peer from './Peer';

export type EventMessage<Message, PeerData> =
  | {|
      event: 'PEER_CONNECT_SUCCESS',
      connectedPeer: ConnectedPeer<Message, PeerData>,
    |}
  | {|
      event: 'PEER_CLOSED',
      peer: Peer<Message> | ConnectedPeer<Message, PeerData>,
    |};

export type OnEvent<Message, PeerData> = (
  event: EventMessage<Message, PeerData>,
) => void;
