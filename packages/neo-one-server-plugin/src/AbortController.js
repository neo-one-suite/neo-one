/* @flow */
import { CustomError } from '@neo-one/utils';
import EventEmitter from 'events';

export class AbortError extends CustomError {
  code: string;

  constructor() {
    super('Operation aborted');
    this.code = 'ABORT';
  }
}

export class AbortSignal extends EventEmitter {
  _aborted: boolean;

  constructor() {
    super();
    this._aborted = false;
  }

  get aborted(): boolean {
    return this._aborted;
  }

  set aborted(value: boolean) {
    this._aborted = value;
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

export class CombinedAbortSignal extends AbortSignal {
  signals: Array<AbortSignal>;

  constructor(signals: Array<AbortSignal>) {
    super();
    this.signals = signals;
  }

  get aborted(): boolean {
    return this._aborted || this.signals.some(signal => signal.aborted);
  }

  set aborted(value: boolean) {
    this._aborted = value;
    this.signals.forEach(signal => {
      // eslint-disable-next-line
      signal.aborted = value;
    });
  }

  check(): void {
    this.signals.forEach(signal => signal.check());
  }

  toString() {
    return '[object CombinedAbortSignal]';
  }

  // $FlowFixMe
  get [Symbol.toStringTag]() {
    return 'CombinedAbortSignal';
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

  static combineSignals(
    signal: AbortSignal,
    ...signals: Array<AbortSignal>
  ): AbortSignal {
    return new CombinedAbortSignal([signal].concat(signals));
  }
}
