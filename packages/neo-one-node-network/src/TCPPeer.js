/* @flow */
import { type Duplex } from 'stream';
import { type Endpoint, getEndpointConfig } from '@neo-one/node-core';

import net from 'net';

import Peer from './Peer';

type TCPPeerOptions<Message> = {|
  endpoint: Endpoint,
  socket?: net.Socket,
  transform: Duplex,
  onError: (peer: Peer<Message>, error: Error) => void,
  onClose: (peer: Peer<Message>) => void,
  timeoutMS: number,
|};

export default class TCPPeer<Message> extends Peer<Message> {
  _socket: net.Socket;
  _host: string;
  _port: number;
  _timeoutMS: number;
  _initialConnected: boolean;

  constructor(options: TCPPeerOptions<Message>) {
    const socket = options.socket || new net.Socket();
    super({
      endpoint: options.endpoint,
      stream: socket,
      transform: options.transform,
      onError: options.onError,
      onClose: options.onClose,
    });
    this._socket = socket;
    const endpointConfig = getEndpointConfig(options.endpoint);
    this._host = endpointConfig.host;
    this._port = endpointConfig.port;
    this._timeoutMS = options.timeoutMS;
    this._initialConnected = options.socket != null;
  }

  async _connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._socket.once('error', error => {
        this.close();
        reject(error);
      });
      this._socket.setTimeout(this._timeoutMS, () => {
        this.close();
      });
      if (this._initialConnected) {
        resolve();
      } else {
        this._socket.connect(
          {
            host: this._host,
            port: this._port,
          },
          () => resolve(),
        );
      }
    });
  }

  _close(): void {
    this._socket.end();
    this._socket.destroy();
  }
}
