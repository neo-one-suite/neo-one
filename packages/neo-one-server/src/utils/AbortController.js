/* @flow */
import EventEmitter from 'events';

export class AbortError extends Error {
  code: string;

  constructor() {
    super('Operation aborted');
    this.code = 'ABORT';
  }
}

export class AbortSignal extends EventEmitter {
  aborted: boolean;

  constructor() {
    super();
    this.aborted = false;
  }

  check(): void {
    if (this.aborted) {
      throw new AbortError();
    }
  }

  toString() {
    return '[object AbortSignal]';
  }

  // $FlowFixMe
  get [Symbol.toStringTag]() {
    return 'AbortSignal';
  }
}

export class AbortController {
  signal: AbortSignal;

  constructor() {
    this.signal = new AbortSignal();
  }

  abort() {
    this.signal.aborted = true;
    this.signal.emit('abort');
  }

  toString() {
    return '[object AbortController]';
  }

  // $FlowFixMe
  get [Symbol.toStringTag]() {
    return 'AbortController';
  }
}
