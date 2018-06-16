// tslint:disable readonly-keyword no-object-mutation
import { Observable, ObservableInput, OperatorFunction, Subscriber, Subscription, TeardownLogic } from 'rxjs';
import { Operator } from 'rxjs/internal/Operator';
import { OuterSubscriber } from 'rxjs/internal/OuterSubscriber';
import { subscribeToResult } from 'rxjs/internal/util/subscribeToResult';

type LastValue<R> = { type: 'value'; value: R } | { type: 'empty' };
// tslint:disable-next-line no-any
const EMPTY_LAST_VALUE: LastValue<any> = { type: 'empty' };

export class MergeScanSubscriber<T, R> extends OuterSubscriber<T, R> {
  private hasValue = false;
  private hasCompleted = false;
  private lastValue: LastValue<T> = EMPTY_LAST_VALUE;
  private active = false;
  private index = 0;
  private readonly accumulator: (acc: R | undefined, value: T) => ObservableInput<R>;
  private acc: R | undefined;

  public constructor(
    destination: Subscriber<R>,
    accumulator: (acc: R | undefined, value: T) => ObservableInput<R>,
    acc: R | undefined,
  ) {
    super(destination);
    this.accumulator = accumulator;
    this.acc = acc;
  }

  public notifyNext(_outerValue: T, innerValue: R): void {
    const { destination } = this;
    this.acc = innerValue;
    this.hasValue = true;
    if (destination.next !== undefined) {
      destination.next(innerValue);
    }
  }

  public notifyComplete(innerSub: Subscription): void {
    const { lastValue } = this;
    this.remove(innerSub);
    this.active = false;
    if (lastValue.type === 'value') {
      this.lastValue = EMPTY_LAST_VALUE;
      this.next(lastValue.value);
    } else if (!this.active && this.hasCompleted) {
      if (!this.hasValue && this.destination.next !== undefined) {
        this.destination.next(this.acc);
      }
      if (this.destination.complete !== undefined) {
        this.destination.complete();
      }
    }
  }

  protected _next(value: T): void {
    if (!this.active) {
      const { index, destination } = this;
      this.index += 1;
      try {
        const result = this.accumulator(this.acc, value);

        this.active = true;
        this._innerSub(result, value, index);
      } catch (error) {
        if (destination.error !== undefined) {
          destination.error(error);
        }
      }
    } else {
      this.lastValue = { type: 'value', value };
    }
  }

  protected _complete(): void {
    this.hasCompleted = true;
    if (!this.active && this.lastValue.type === 'empty') {
      if (!this.hasValue && this.destination.next !== undefined) {
        this.destination.next(this.acc);
      }
      if (this.destination.complete !== undefined) {
        this.destination.complete();
      }
    }
  }

  protected _innerSub(ish: {}, value: T, index: number): void {
    this.add(subscribeToResult(this, ish, value, index));
  }
}

export class MergeScanOperator<T, R> implements Operator<T, R> {
  public readonly accumulator: (acc: R | undefined, value: T) => ObservableInput<R>;
  public readonly seed: R | undefined | undefined;
  public constructor(accumulator: (acc: R | undefined, value: T) => ObservableInput<R>, seed?: R) {
    this.accumulator = accumulator;
    this.seed = seed;
  }

  // tslint:disable-next-line
  public call(subscriber: Subscriber<R>, source: any): TeardownLogic {
    // tslint:disable-next-line
    return source.subscribe(new MergeScanSubscriber(subscriber, this.accumulator, this.seed));
  }
}

export function mergeScanLatest<T, R>(
  accumulator: (acc: R | undefined, value: T) => ObservableInput<R>,
  seed?: R,
): OperatorFunction<T, R> {
  return (source$: Observable<T>) =>
    (source$ as { lift: (value: Operator<T, R>) => Observable<R> }).lift(new MergeScanOperator(accumulator, seed));
}
