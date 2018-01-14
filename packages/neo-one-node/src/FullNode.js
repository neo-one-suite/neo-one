/* @flow */
import type { Subscription } from 'rxjs/Subscription';

import fullNode$, { type FullNodeOptions } from './fullNode$';

export default class FullNode {
  _options: FullNodeOptions;
  _onError: ?(error: Error) => void;
  _subscription: ?Subscription;

  constructor(options: FullNodeOptions, onError?: (error: Error) => void) {
    this._options = options;
    this._onError = onError;
    this._subscription = null;
  }

  start(): void {
    if (this._subscription == null) {
      let observer;
      if (this._onError != null) {
        const onError = this._onError;
        observer = ({
          error: onError,
          complete: () => onError(new Error('Unexpected end')),
        }: $FlowFixMe);
      }
      this._subscription = fullNode$(this._options).subscribe(observer);
    }
  }

  stop(): void {
    if (this._subscription != null) {
      this._subscription.unsubscribe();
      this._subscription = null;
    }
  }
}
