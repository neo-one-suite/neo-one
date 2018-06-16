import { CustomError } from '@neo-one/utils';
import { EventEmitter } from 'events';

export class AbortError extends CustomError {
  public readonly code: string;

  public constructor() {
    super('Operation aborted');
    this.code = 'ABORT';
  }
}

export class AbortSignal extends EventEmitter {
  protected mutableAborted: boolean;

  public constructor() {
    super();
    this.mutableAborted = false;
  }

  public get aborted(): boolean {
    return this.mutableAborted;
  }

  public set aborted(value: boolean) {
    this.mutableAborted = value;
  }

  public check(): void {
    if (this.aborted) {
      throw new AbortError();
    }
  }

  public toString() {
    return '[object AbortSignal]';
  }

  public get [Symbol.toStringTag]() {
    return 'AbortSignal';
  }
}

export class CombinedAbortSignal extends AbortSignal {
  public readonly signals: ReadonlyArray<AbortSignal>;

  public constructor(signals: ReadonlyArray<AbortSignal>) {
    super();
    this.signals = signals;
  }

  public get aborted(): boolean {
    return this.mutableAborted || this.signals.some((signal) => signal.aborted);
  }

  public set aborted(value: boolean) {
    this.mutableAborted = value;
    this.signals.forEach((signal) => {
      // tslint:disable-next-line no-object-mutation
      signal.aborted = value;
    });
  }

  public toString() {
    return '[object CombinedAbortSignal]';
  }

  public get [Symbol.toStringTag]() {
    return 'CombinedAbortSignal';
  }
}

export class AbortController {
  // tslint:disable-next-line readonly-array
  public static combineSignals(signal: AbortSignal, ...signals: AbortSignal[]): AbortSignal {
    return new CombinedAbortSignal([signal].concat(signals));
  }

  public readonly signal: AbortSignal;

  public constructor() {
    this.signal = new AbortSignal();
  }

  public abort() {
    // tslint:disable-next-line no-object-mutation
    this.signal.aborted = true;
    this.signal.emit('abort');
  }

  public toString() {
    return '[object AbortController]';
  }

  public get [Symbol.toStringTag]() {
    return 'AbortController';
  }
}
