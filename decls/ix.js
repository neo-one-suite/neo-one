/* @flow */
/* eslint-disable */

type UnaryFunction<T, R> = (source: T) => R;

// type OperatorFunction<T, R> = UnaryFunction<Iterable<T>, IterableX<R>>;

type OperatorAsyncFunction<T, R> = UnaryFunction<AsyncIterator<T>, AsyncIterableX<R>>;

type AsyncIterableInput<TSource> =
  | AsyncIterable<TSource>
  | Iterable<TSource>
  | Iterable<Promise<TSource>>
  | Promise<TSource>
  | rxjs$Observable<TSource>;

declare class AsyncIterableX<T> extends $AsyncIterable<T, void, void> {
  @@asyncIterator(): $AsyncIterator<T, void, void>;

  forEach(
    projection: (value: T, index: number) => void | Promise<void>,
    thisArg?: any
  ): Promise<void>;

  pipe(): AsyncIterableX<T>;
  pipe<A>(op1: OperatorAsyncFunction<T, A>): AsyncIterableX<A>;
  pipe<A, B>(
    op1: OperatorAsyncFunction<T, A>,
    op2: OperatorAsyncFunction<A, B>
  ): AsyncIterableX<B>;
  pipe<A, B, C>(
    op1: OperatorAsyncFunction<T, A>,
    op2: OperatorAsyncFunction<A, B>,
    op3: OperatorAsyncFunction<B, C>
  ): AsyncIterableX<C>;
  pipe<A, B, C, D>(
    op1: OperatorAsyncFunction<T, A>,
    op2: OperatorAsyncFunction<A, B>,
    op3: OperatorAsyncFunction<B, C>,
    op4: OperatorAsyncFunction<C, D>
  ): AsyncIterableX<D>;
  pipe<A, B, C, D, E>(
    op1: OperatorAsyncFunction<T, A>,
    op2: OperatorAsyncFunction<A, B>,
    op3: OperatorAsyncFunction<B, C>,
    op4: OperatorAsyncFunction<C, D>,
    op5: OperatorAsyncFunction<D, E>
  ): AsyncIterableX<E>;
  pipe<A, B, C, D, E, F>(
    op1: OperatorAsyncFunction<T, A>,
    op2: OperatorAsyncFunction<A, B>,
    op3: OperatorAsyncFunction<B, C>,
    op4: OperatorAsyncFunction<C, D>,
    op5: OperatorAsyncFunction<D, E>,
    op6: OperatorAsyncFunction<E, F>
  ): AsyncIterableX<F>;
  pipe<A, B, C, D, E, F, G>(
    op1: OperatorAsyncFunction<T, A>,
    op2: OperatorAsyncFunction<A, B>,
    op3: OperatorAsyncFunction<B, C>,
    op4: OperatorAsyncFunction<C, D>,
    op5: OperatorAsyncFunction<D, E>,
    op6: OperatorAsyncFunction<E, F>,
    op7: OperatorAsyncFunction<F, G>
  ): AsyncIterableX<G>;
  pipe<A, B, C, D, E, F, G, H>(
    op1: OperatorAsyncFunction<T, A>,
    op2: OperatorAsyncFunction<A, B>,
    op3: OperatorAsyncFunction<B, C>,
    op4: OperatorAsyncFunction<C, D>,
    op5: OperatorAsyncFunction<D, E>,
    op6: OperatorAsyncFunction<E, F>,
    op7: OperatorAsyncFunction<F, G>,
    op8: OperatorAsyncFunction<G, H>
  ): AsyncIterableX<H>;
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: OperatorAsyncFunction<T, A>,
    op2: OperatorAsyncFunction<A, B>,
    op3: OperatorAsyncFunction<B, C>,
    op4: OperatorAsyncFunction<C, D>,
    op5: OperatorAsyncFunction<D, E>,
    op6: OperatorAsyncFunction<E, F>,
    op7: OperatorAsyncFunction<F, G>,
    op8: OperatorAsyncFunction<G, H>,
    op9: OperatorAsyncFunction<H, I>
  ): AsyncIterableX<I>;
  pipe<R>(...operations: Array<OperatorAsyncFunction<T, R>>): AsyncIterableX<R>;

  static as(source: string): AsyncIterableX<string>;
  static as<T>(source: AsyncIterableInput<T>): AsyncIterableX<T>;
  static as<T>(source: T): AsyncIterableX<T>;

  static from<TSource>(
    source: AsyncIterableInput<TSource>,
  ): AsyncIterableX<TSource>;

  static of<TSource>(...args: Array<TSource>): AsyncIterableX<TSource>;
}

declare module 'ix/asynciterable/asynciterablex' {
  declare module.exports: {
    AsyncIterableX: typeof AsyncIterableX
  }
}

declare module 'ix/asynciterable/pipe/index' {
  declare export function filter<T>(
    predicate: (value: T, index: number) => boolean | Promise<boolean>,
    thisArg?: any
  ): OperatorAsyncFunction<T, T>;
  declare export function filter<T>(predicate: typeof Boolean): OperatorAsyncFunction<T, $NonMaybeType<T>>;
  declare export function map<TSource, TResult>(
    selector: (value: TSource, index: number) => Promise<TResult> | TResult,
    thisArg?: any
  ): OperatorAsyncFunction<TSource, TResult>;
  declare export function flatMap<TSource, TResult>(
    selector: (value: TSource) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>,
    thisArg?: any
  ): OperatorAsyncFunction<TSource, TResult>;
  declare export function flatten<T>(depth?: number): OperatorAsyncFunction<AsyncIterableX<T>, T>;
  declare export function scan<T, R>(
    accumulator: (previousValue: R, currentValue: T, currentIndex: number) => R | Promise<R>,
    seed: R
  ): OperatorAsyncFunction<T, R>;
}
