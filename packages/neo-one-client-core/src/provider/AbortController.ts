// tslint:disable no-object-mutation readonly-keyword readonly-array no-loop-statement
// tslint:disable strict-type-predicates strict-boolean-expressions no-array-mutation

type Callback = (event: Event) => void;

class Emitter {
  private readonly listeners: { [type: string]: Callback[] };

  public constructor() {
    this.listeners = {};
  }

  public addEventListener(type: string, callback: Callback) {
    if (!(type in this.listeners)) {
      this.listeners[type] = [];
    }

    this.listeners[type].push(callback);
  }

  public removeEventListener(type: string, callback: Callback) {
    if (!(type in this.listeners)) {
      return;
    }
    const stack = this.listeners[type];
    for (let i = 0, l = stack.length; i < l; i += 1) {
      if (stack[i] === callback) {
        stack.splice(i, 1);

        return;
      }
    }
  }

  public dispatchEvent(event: Event) {
    if (!(event.type in this.listeners)) {
      return;
    }

    const debounce = (callback: Callback) => {
      setTimeout(() => callback.call(this, event));
    };

    const stack = this.listeners[event.type];
    for (let i = 0, l = stack.length; i < l; i += 1) {
      debounce(stack[i]);
    }
  }
}

export class AbortSignal extends Emitter {
  // tslint:disable-next-line readonly-keyword
  public aborted: boolean;
  // tslint:disable-next-line readonly-keyword
  public onabort: ((event: Event) => void) | null;

  public constructor() {
    super();

    this.aborted = false;
    // tslint:disable-next-line no-null-keyword
    this.onabort = null;
  }

  public toString() {
    return '[object AbortSignal]';
  }

  public dispatchEvent(event: Event) {
    if (event.type === 'abort') {
      // tslint:disable-next-line no-object-mutation
      this.aborted = true;
      if (typeof this.onabort === 'function') {
        this.onabort.call(this, event);
      }
    }

    super.dispatchEvent(event);
  }
}

export class AbortController {
  public readonly signal: AbortSignal;

  public constructor() {
    this.signal = new AbortSignal();
  }

  public abort() {
    let event;
    try {
      event = new Event('abort');
    } catch {
      // tslint:disable-next-line strict-type-predicates
      if (typeof document !== 'undefined') {
        event = document.createEvent('Event');
        event.initEvent('abort', false, false);
      } else {
        event = {
          type: 'abort',
          bubbles: false,
          cancelable: false,
        };
      }
    }
    // tslint:disable-next-line no-any
    this.signal.dispatchEvent(event as any);
  }

  public toString() {
    return '[object AbortController]';
  }
}

if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
  Object.defineProperty(AbortController.prototype, Symbol.toStringTag, {
    configurable: true,
    value: 'AbortController',
  });
  Object.defineProperty(AbortSignal.prototype, Symbol.toStringTag, {
    configurable: true,
    value: 'AbortSignal',
  });
}
