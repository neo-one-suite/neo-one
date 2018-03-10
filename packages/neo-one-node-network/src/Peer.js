/* @flow */
import type { Duplex } from 'stream';
import type { Endpoint } from '@neo-one/node-core';

import through from 'through';

import { ReceiveMessageTimeoutError } from './errors';

export type PeerOptions<Message> = {|
  endpoint: Endpoint,
  stream: Duplex,
  transform: Duplex,
  onError: (peer: Peer<Message>, error: Error) => void,
  onClose: (peer: Peer<Message>) => void,
|};

export default class Peer<Message> {
  endpoint: Endpoint;
  connected: boolean;

  _stream: Duplex;
  _transform: Duplex;
  _buffer: Duplex;

  _connecting: boolean;
  _closed: boolean;

  __onError: (peer: Peer<Message>, error: Error) => void;
  __onClose: (peer: Peer<Message>) => void;

  constructor(options: PeerOptions<Message>) {
    this.endpoint = options.endpoint;
    this.connected = false;

    this._stream = options.stream;
    this._transform = options.transform;
    this._buffer = through();

    this._connecting = false;
    this._closed = false;

    this.__onError = options.onError;
    this.__onClose = options.onClose;

    this._transform.on('error', this._onError.bind(this));
    this._buffer.on('error', this._onError.bind(this));
    this._buffer.pause();
    this._stream.pipe(this._transform).pipe(this._buffer);
  }

  async connect(): Promise<void> {
    if (this._connecting || this.connected) {
      return;
    }
    this._connecting = true;
    this._closed = false;

    try {
      await this._connect();
      this._stream.on('error', this._onError.bind(this));
      this._stream.on('close', this._onClose.bind(this));
      this.connected = true;
    } finally {
      this._connecting = false;
    }
  }

  close(hadError?: boolean): void {
    if (this._closed) {
      return;
    }
    this._closed = true;

    if (!this._connecting && !this.connected) {
      return;
    }
    this._connecting = false;
    this.connected = false;

    this._close(!!hadError);
    this._stream.unpipe(this._transform);
    this._transform.unpipe(this._buffer);
    this._transform.end();
    this._buffer.end();
  }

  write(buffer: Buffer): void {
    if (!this.connected || this._closed) {
      return;
    }

    try {
      this._stream.write(buffer);
    } catch (error) {
      this._onError(error);
    }
  }

  receiveMessage(timeoutMS?: number): Promise<Message> {
    return new Promise((resolve, reject) => {
      let handled = false;
      const cleanup = () => {
        this._buffer.pause();
        handled = true;
        // eslint-disable-next-line
        this._stream.removeListener('error', onError);
        // eslint-disable-next-line
        this._transform.removeListener('error', onError);
        // eslint-disable-next-line
        this._buffer.removeListener('error', onError);
        // eslint-disable-next-line
        this._buffer.removeListener('data', onDataReceived);
      };

      const onError = (error: Error) => {
        if (!handled) {
          cleanup();
          reject(error);
        }
      };

      const onDataReceived = (data: Message) => {
        if (!handled) {
          cleanup();
          resolve(data);
        }
      };

      this._stream.once('error', onError);
      this._transform.once('error', onError);
      this._buffer.once('error', onError);
      this._buffer.once('data', onDataReceived);
      this._buffer.resume();

      if (timeoutMS != null) {
        setTimeout(() => onError(new ReceiveMessageTimeoutError()), timeoutMS);
      }
    });
  }

  streamData(
    onDataReceived: (data: Message) => void,
  ): { unsubscribe: () => void } {
    this._buffer.on('data', onDataReceived);
    this._buffer.resume();
    return {
      unsubscribe: () => {
        this._buffer.pause();
        this._buffer.removeListener('data', onDataReceived);
      },
    };
  }

  _onError(error: Error): void {
    this.close(true);
    this.__onError(this, error);
  }

  _onClose(): void {
    this._closed = true;
    this.__onClose(this);
  }

  // eslint-disable-next-line
  async _connect(): Promise<void> {}
  // eslint-disable-next-line
  _close(hadError: boolean): void {}
}
