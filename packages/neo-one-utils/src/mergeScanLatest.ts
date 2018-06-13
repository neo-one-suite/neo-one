import {
  Observable,
  ObservableInput,
  OperatorFunction,
  Subscriber,
  Subscription,
} from 'rxjs';
import { Operator } from 'rxjs/internal/Operator';
import { OuterSubscriber } from 'rxjs/internal/OuterSubscriber';
import { subscribeToResult } from 'rxjs/internal/util/subscribeToResult';

const EMPTY_LAST_VALUE = {};

export class MergeScanSubscriber<T, R> extends OuterSubscriber<T, R> {
  private hasValue: boolean = false;
  private hasCompleted: boolean = false;
  private lastValue: any = EMPTY_LAST_VALUE;
  private active: boolean = false;
  private index: number = 0;
  private readonly accumulator: (
    acc: R | undefined,
    value: T,
  ) => ObservableInput<R>;
  private acc: R | null;

  constructor(
    destination: Subscriber<R>,
    accumulator: (acc: R | undefined, value: T) => ObservableInput<R>,
    acc: R | null,
  ) {
    super(destination);
    this.accumulator = accumulator;
    this.acc = acc;
  }

  public notifyNext(outerValue: T, innerValue: R): void {
    const { destination } = this;
    this.acc = innerValue;
    this.hasValue = true;
    if (destination.next != null) {
      destination.next(innerValue);
    }
  }

  public notifyComplete(innerSub: Subscription): void {
    const { lastValue } = this;
    this.remove(innerSub);
    this.active = false;
    if (lastValue !== EMPTY_LAST_VALUE) {
      this.lastValue = EMPTY_LAST_VALUE;
      this.next(lastValue);
    } else if (!this.active && this.hasCompleted) {
      if (this.hasValue === false) {
        if (this.destination.next != null) {
          this.destination.next(this.acc);
        }
      }
      if (this.destination.complete != null) {
        this.destination.complete();
      }
    }
  }

  protected _next(value: any): void {
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
        if (destination.error != null) {
          destination.error(error);
        }
      }
    } else {
      this.lastValue = value;
    }
  }

  protected _complete(): void {
    this.hasCompleted = true;
    if (!this.active && this.lastValue === EMPTY_LAST_VALUE) {
      if (this.hasValue === false) {
        if (this.destination.next != null) {
          this.destination.next(this.acc);
        }
      }
      if (this.destination.complete != null) {
        this.destination.complete();
      }
    }
  }

  protected _innerSub(ish: any, value: T, index: number): void {
    this.add(subscribeToResult(this, ish, value, index));
  }
}

export class MergeScanOperator<T, R> implements Operator<T, R> {
  public readonly accumulator: (
    acc: R | undefined,
    value: T,
  ) => ObservableInput<R>;
  public readonly seed: R | null | undefined;
  public constructor(
    accumulator: (acc: R | undefined, value: T) => ObservableInput<R>,
    seed?: R,
  ) {
    this.accumulator = accumulator;
    this.seed = seed;
  }
  public call(subscriber: Subscriber<R>, source: any): any {
    return source.subscribe(
      new MergeScanSubscriber(subscriber, this.accumulator, this.seed),
    );
  }
}

export function mergeScanLatest<T, R>(
  accumulator: (acc: R | undefined, value: T) => ObservableInput<R>,
  seed?: R,
): OperatorFunction<T, R> {
  return (source: Observable<T>) =>
    (source as any).lift(new MergeScanOperator(accumulator, seed));
}
