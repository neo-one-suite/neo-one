/* @flow */
import { type Observable, type Subscription, Subscriber } from 'rxjs';
import { OuterSubscriber } from 'rxjs/internal/OuterSubscriber';
import { Operator } from 'rxjs/internal/Operator';
import { subscribeToResult } from 'rxjs/internal/util/subscribeToResult';

const EMPTY_LAST_VALUE = {};

export class MergeScanSubscriber<T, R> extends OuterSubscriber<T, R> {
  hasValue: boolean = false;
  hasCompleted: boolean = false;
  lastValue: any = EMPTY_LAST_VALUE;
  active: boolean = false;
  index: number = 0;
  accumulator: (acc?: R, value: T) => rxjs$ObservableInput<R>;
  acc: ?R;

  constructor(
    destination: Subscriber<R>,
    accumulator: (acc?: R, value: T) => rxjs$ObservableInput<R>,
    acc: ?R,
  ) {
    super(destination);
    this.accumulator = accumulator;
    this.acc = acc;
  }

  _next(value: any): void {
    if (!this.active) {
      const { index, destination } = this;
      this.index += 1;
      try {
        const result = this.accumulator(
          this.acc == null ? undefined : this.acc,
          value,
        );
        this.active = true;
        this._innerSub(result, value, index);
      } catch (error) {
        destination.error(error);
      }
    } else {
      this.lastValue = value;
    }
  }

  _innerSub(ish: any, value: T, index: number): void {
    this.add(subscribeToResult(this, ish, value, index));
  }

  _complete(): void {
    this.hasCompleted = true;
    if (!this.active && this.lastValue === EMPTY_LAST_VALUE) {
      if (this.hasValue === false) {
        this.destination.next(this.acc);
      }
      this.destination.complete();
    }
  }

  notifyNext(outerValue: T, innerValue: R): void {
    const { destination } = this;
    this.acc = innerValue;
    this.hasValue = true;
    destination.next(innerValue);
  }

  notifyComplete(innerSub: Subscription): void {
    const { lastValue } = this;
    this.remove(innerSub);
    this.active = false;
    if (lastValue !== EMPTY_LAST_VALUE) {
      this.lastValue = EMPTY_LAST_VALUE;
      this._next(lastValue);
    } else if (!this.active && this.hasCompleted) {
      if (this.hasValue === false) {
        this.destination.next(this.acc);
      }
      this.destination.complete();
    }
  }
}

export class MergeScanOperator<T, R> implements Operator<T, R> {
  accumulator: (acc?: R, value: T) => rxjs$ObservableInput<R>;
  seed: ?R;

  constructor(
    accumulator: (acc?: R, value: T) => rxjs$ObservableInput<R>,
    seed?: R,
  ) {
    this.accumulator = accumulator;
    this.seed = seed;
  }

  call(subscriber: Subscriber<R>, source: any): any {
    return source.subscribe(
      new MergeScanSubscriber(subscriber, this.accumulator, this.seed),
    );
  }
}

export function mergeScanLatest<T, R>(
  accumulator: (acc?: R, value: T) => rxjs$ObservableInput<R>,
  seed?: R,
): rxjs$OperatorFunction<T, R> {
  return (source: Observable<T>) =>
    (source: $FlowFixMe).lift(new MergeScanOperator(accumulator, seed));
}
