// tslint:disable
/**
 * Marks an interface or class as not implementable or extendable.
 *
 * Makes it an error to pass values that would otherwise match the shape of the interface.
 *
 * See <fill_me_in> for more info.
 */
declare const one0: unique symbol;
/**
 * Marks an interface or class as not implementable or extendable.
 *
 * Makes it an error to pass values that would otherwise match the shape of the interface.
 *
 * See <fill_me_in> for more info.
 */
declare const one1: unique symbol;

interface Boolean {
  readonly [one0]: unique symbol;
}
interface BooleanConstructor {
  readonly [one0]: unique symbol;
}
declare const Boolean: BooleanConstructor;

interface Number {
  readonly [one0]: unique symbol;
}
interface NumberConstructor {
  readonly [one0]: unique symbol;
}
declare const Number: NumberConstructor;

interface String {
  readonly [one0]: unique symbol;
}
interface StringConstructor {
  readonly [one0]: unique symbol;
}
declare const String: StringConstructor;

interface Function {}
interface FunctionConstructor {
  readonly [one0]: unique symbol;
}
declare const Function: FunctionConstructor;

interface IArguments {
  readonly [one0]: unique symbol;
}

interface Object {}
interface ObjectConstructor {
  /**
   * Returns the names of the enumerable properties and methods of an object.
   * @param o Object that contains the properties and methods.
   */
  readonly keys: (o: {}) => string[];
  readonly [one0]: unique symbol;
}
declare const Object: ObjectConstructor;

interface RegExp {
  readonly [one0]: unique symbol;
}
interface RegExpConstructor {
  readonly [one0]: unique symbol;
}
declare const RegExp: RegExpConstructor;

interface Error {
  readonly message: string;
  readonly [one0]: unique symbol;
}
interface ErrorConstructor {
  new (message?: string): Error;
  readonly [one0]: unique symbol;
}
declare const Error: ErrorConstructor;

interface Symbol {
  readonly [one0]: unique symbol;
}
interface SymbolConstructor {
  /**
   * Returns a Symbol object from the global symbol registry matching the given key if found.
   * Otherwise, returns a new symbol with this key.
   * @param key key to search for.
   */
  readonly for: (key: string) => symbol;
  /**
   * A method that returns the default iterator for an object. Called by the semantics of the
   * for-of statement.
   */
  readonly iterator: symbol;
  /**
   * A method that converts an object to a corresponding primitive value.
   * Called by the ToPrimitive abstract operation.
   */
  readonly toPrimitive: symbol;
  readonly [one0]: unique symbol;
}
declare var Symbol: SymbolConstructor;

// Buffer class
type BufferEncoding = 'ascii' | 'utf8' | 'utf16le' | 'ucs2' | 'base64' | 'latin1' | 'hex';
interface Buffer {
  /**
   * Gets the length of the array. This is a number one higher than the highest element defined in an array.
   */
  readonly length: number;
  readonly equals: (otherBuffer: Buffer) => boolean;
  readonly toString: (encoding: 'utf8') => string;
  readonly [one0]: unique symbol;
}
interface BufferConstructor {
  /**
   * Creates a new Buffer containing the given JavaScript string {str}.
   * If provided, the {encoding} parameter identifies the character encoding.
   * If not provided, {encoding} defaults to 'utf8'.
   */
  readonly from: (str: string, encoding?: BufferEncoding) => Buffer;
  /**
   * Returns a buffer which is the result of concatenating all the buffers in the list together.
   *
   * If the list has no items, then it returns a zero-length buffer.
   * If the list has one or more items, then a new Buffer is created.
   *
   * @param list An array of Buffer objects to concatenate
   */
  readonly concat: (list: Buffer[]) => Buffer;
  readonly [one0]: unique symbol;
}
/**
 * Raw data is stored in instances of the Buffer class.
 * A Buffer is similar to an array of integers but corresponds to a raw memory allocation outside the V8 heap.  A Buffer cannot be resized.
 * Valid string encodings: 'ascii'|'utf8'|'utf16le'|'ucs2'(alias of 'utf16le')|'base64'|'hex'
 */
declare var Buffer: BufferConstructor;

interface Console {
  /**
   * Prints to `stdout` with newline.
   */
  readonly log: (message?: any, ...optionalParams: any[]) => void;
  readonly [one0]: unique symbol;
}

declare var console: Console;

interface IteratorResult<T> {
  readonly done: boolean;
  readonly value: T;
  readonly [one0]: unique symbol;
}

interface Iterator<T> {
  readonly next: (value?: any) => IteratorResult<T>;
  readonly [one0]: unique symbol;
}

interface Iterable<T> {
  readonly [Symbol.iterator]: () => Iterator<T>;
  readonly [one0]: Iterator<T>[typeof one0];
}

interface IterableIterator<T> extends Iterator<T> {
  readonly [Symbol.iterator]: () => IterableIterator<T>;
  readonly [one1]: unique symbol;
}

interface ReadonlyArray<T> extends Iterable<T> {
  readonly [Symbol.iterator]: () => IterableIterator<T>;
  /**
   * Gets the length of the array. This is a number one higher than the highest element defined in an array.
   */
  readonly length: number;
  /**
   * Returns an iterable of key, value pairs for every entry in the array
   */
  readonly entries: () => IterableIterator<[number, T]>;
  /**
   * Returns a string representation of an array.
   */
  readonly toString: () => string;
  /**
   * Combines two or more arrays.
   * @param items Additional items to add to the end of array1.
   */
  readonly concat: {
    <T>(...items: ConcatArray<T>[]): T[];
    <T>(...items: T[]): T[];
    <T>(...items: (T | ConcatArray<T>)[]): T[];
  };
  /**
   * Adds all the elements of an array separated by the specified separator string.
   * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
   */
  readonly join: (separator?: string) => string;
  /**
   * Returns a section of an array.
   * @param start The beginning of the specified portion of the array.
   * @param end The end of the specified portion of the array.
   */
  readonly slice: (start?: number, end?: number) => T[];
  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param callbackfn A function that accepts up to two arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
   */
  readonly every: (callbackfn: (value: T, index: number) => boolean) => boolean;
  /**
   * Determines whether the specified callback function returns true for any element of an array.
   * @param callbackfn A function that accepts up to two arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
   */
  readonly some: (callbackfn: (value: T, index: number) => boolean) => boolean;
  /**
   * Performs the specified action for each element in an array.
   * @param callbackfn  A function that accepts up to two arguments. forEach calls the callbackfn function one time for each element in the array.
   */
  readonly forEach: (callbackfn: (value: T, index: number) => void) => void;
  /**
   * Calls a defined callback function on each element of an array, and returns an array that contains the results.
   * @param callbackfn A function that accepts up to two arguments. The map method calls the callbackfn function one time for each element in the array.
   */
  readonly map: <U>(callbackfn: (value: T, index: number) => U) => U[];
  /**
   * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
   */
  readonly reduce: {
    (callbackfn: (previousValue: T, currentValue: T, currentIndex: number) => T, initialValue: T): T;
    <U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;
  };
  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param callbackfn A function that accepts up to two arguments. The filter method calls the callbackfn function one time for each element in the array.
   */
  readonly filter: {
    <S extends T>(callbackfn: (value: T, index: number) => value is S): S[];
    (callbackfn: (value: T, index: number) => any): T[];
  };

  readonly [n: number]: T;
  readonly [one1]: unique symbol;
}

type ConcatArray<T> = Array<T> | ReadonlyArray<T>;

interface Array<T> extends Iterable<T> {
  readonly [Symbol.iterator]: () => IterableIterator<T>;
  /**
   * Gets the length of the array. This is a number one higher than the highest element defined in an array.
   */
  readonly length: number;
  /**
   * Returns an iterable of key, value pairs for every entry in the array
   */
  readonly entries: () => IterableIterator<[number, T]>;
  /**
   * Returns a string representation of an array.
   */
  readonly toString: () => string;
  /**
   * Combines two or more arrays.
   * @param items Additional items to add to the end of array1.
   */
  readonly concat: {
    <T>(...items: ConcatArray<T>[]): T[];
    <T>(...items: T[]): T[];
    <T>(...items: (T | ConcatArray<T>)[]): T[];
  };
  /**
   * Adds all the elements of an array separated by the specified separator string.
   * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
   */
  readonly join: (separator?: string) => string;
  /**
   * Returns a section of an array.
   * @param start The beginning of the specified portion of the array.
   * @param end The end of the specified portion of the array.
   */
  readonly slice: (start?: number, end?: number) => T[];
  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param callbackfn A function that accepts up to two arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
   */
  readonly every: (callbackfn: (value: T, index: number) => boolean) => boolean;
  /**
   * Determines whether the specified callback function returns true for any element of an array.
   * @param callbackfn A function that accepts up to two arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
   */
  readonly some: (callbackfn: (value: T, index: number) => boolean) => boolean;
  /**
   * Performs the specified action for each element in an array.
   * @param callbackfn  A function that accepts up to two arguments. forEach calls the callbackfn function one time for each element in the array.
   */
  readonly forEach: (callbackfn: (value: T, index: number) => void) => void;
  /**
   * Calls a defined callback function on each element of an array, and returns an array that contains the results.
   * @param callbackfn A function that accepts up to two arguments. The map method calls the callbackfn function one time for each element in the array.
   */
  readonly map: <U>(callbackfn: (value: T, index: number) => U) => U[];
  // Writable only because it causes wonkiness with tsc otherwise
  /**
   * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
   */
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number) => T, initialValue: T): T;
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;
  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param callbackfn A function that accepts up to two arguments. The filter method calls the callbackfn function one time for each element in the array.
   */
  readonly filter: {
    <S extends T>(callbackfn: (value: T, index: number) => value is S): S[];
    (callbackfn: (value: T, index: number) => any): T[];
  };
  /**
   * Removes the last element from an array and returns it.
   */
  readonly pop: () => T | undefined;
  // Writable only because it causes wonkiness with tsc otherwise
  /**
   * Appends new elements to an array, and returns the new length of the array.
   * @param items New elements of the Array.
   */
  push(...items: T[]): number;

  [n: number]: T;
  readonly [one1]: ReadonlyArray<T>[typeof one1];
}
interface ArrayConstructor {
  readonly [one0]: unique symbol;
}
declare const Array: ArrayConstructor;

interface Map<K, V> extends Iterable<[K, V]> {
  readonly [Symbol.iterator]: () => IterableIterator<[K, V]>;
  readonly forEach: (callbackfn: (value: V, key: K) => void) => void;
  readonly get: (key: K) => V | undefined;
  readonly has: (key: K) => boolean;
  readonly size: number;
  readonly delete: (key: K) => boolean;
  readonly set: (key: K, value: V) => this;
  readonly [one1]: ReadonlyMap<K, V>[typeof one1];
}
interface MapConstructor {
  new <K = any, V = any>(): Map<K, V>;
  readonly prototype: Map<any, any>;
  readonly [one0]: unique symbol;
}
declare var Map: MapConstructor;

interface ReadonlyMap<K, V> extends Iterable<[K, V]> {
  readonly [Symbol.iterator]: () => IterableIterator<[K, V]>;
  readonly forEach: (callbackfn: (value: V, key: K) => void) => void;
  readonly get: (key: K) => V | undefined;
  readonly has: (key: K) => boolean;
  readonly size: number;
  readonly [one1]: unique symbol;
}

interface Set<T> extends Iterable<T> {
  readonly [Symbol.iterator]: () => IterableIterator<T>;
  readonly forEach: (callbackfn: (value: T) => void) => void;
  readonly has: (value: T) => boolean;
  readonly size: number;
  readonly delete: (value: T) => boolean;
  readonly add: (value: T) => this;
  readonly [one1]: ReadonlySet<T>[typeof one1];
}
interface SetConstructor {
  new <T = any>(values?: ReadonlyArray<T>): Set<T>;
  readonly prototype: Set<any>;
}
declare var Set: SetConstructor;

interface ReadonlySet<T> extends Iterable<T> {
  readonly [Symbol.iterator]: () => IterableIterator<T>;
  readonly forEach: (callbackfn: (value: T) => void) => void;
  readonly has: (value: T) => boolean;
  readonly size: number;
  readonly [one1]: unique symbol;
}

interface PropertyDescriptor {
  configurable?: boolean;
  enumerable?: boolean;
  value?: any;
  writable?: boolean;
  get?(): any;
  set?(v: any): void;
}

interface TypedPropertyDescriptor<T> {
  enumerable?: boolean;
  configurable?: boolean;
  writable?: boolean;
  value?: T;
  get?: () => T;
  set?: (value: T) => void;
}

interface TemplateStringsArray extends Array<string> {}
