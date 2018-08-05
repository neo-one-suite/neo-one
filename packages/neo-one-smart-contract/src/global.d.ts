// tslint:disable
interface Boolean {}
interface BooleanConstructor {}
declare const Boolean: BooleanConstructor;

interface Number {}
interface NumberConstructor {}
declare const Number: NumberConstructor;

interface String {}
interface StringConstructor {}
declare const String: StringConstructor;

interface Function {}
interface FunctionConstructor {}
declare const Function: FunctionConstructor;

interface IArguments {}

interface Object {}
interface ObjectConstructor {
  /**
   * Returns the names of the enumerable properties and methods of an object.
   * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
   */
  keys(o: {}): string[];
}
declare const Object: ObjectConstructor;

interface RegExp {}
interface RegExpConstructor {}
declare const RegExp: RegExpConstructor;

interface Error {
  message: string;
}
interface ErrorPrototype {}
interface ErrorConstructor {
  new (message?: string): Error;
  readonly prototype: ErrorPrototype;
}
declare const Error: ErrorConstructor;

interface Symbol {}
interface SymbolConstructor {
  /**
   * Returns a Symbol object from the global symbol registry matching the given key if found.
   * Otherwise, returns a new symbol with this key.
   * @param key key to search for.
   */
  for(key: string): symbol;
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
}
declare var Symbol: SymbolConstructor;

// Buffer class
type BufferEncoding = 'ascii' | 'utf8' | 'utf16le' | 'ucs2' | 'base64' | 'latin1' | 'hex';
interface Buffer {
  /**
   * Gets the length of the array. This is a number one higher than the highest element defined in an array.
   */
  readonly length: number;
  equals(otherBuffer: Buffer): boolean;
}
interface BufferConstructor {
  /**
   * Creates a new Buffer containing the given JavaScript string {str}.
   * If provided, the {encoding} parameter identifies the character encoding.
   * If not provided, {encoding} defaults to 'utf8'.
   */
  from(str: string, encoding?: BufferEncoding): Buffer;
  /**
   * Returns a buffer which is the result of concatenating all the buffers in the list together.
   *
   * If the list has no items, then it returns a zero-length buffer.
   * If the list has one or more items, then a new Buffer is created.
   *
   * @param list An array of Buffer objects to concatenate
   */
  concat(list: Buffer[]): Buffer;
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
  log(message?: any, ...optionalParams: any[]): void;
}

declare var console: Console;

interface IteratorResult<T> {
  done: boolean;
  value: T;
}

interface Iterator<T> {
  next(value?: any): IteratorResult<T>;
  return?(value?: any): IteratorResult<T>;
  throw?(e?: any): IteratorResult<T>;
}

interface Iterable<T> {
  [Symbol.iterator](): Iterator<T>;
}

interface IterableIterator<T> extends Iterator<T> {
  [Symbol.iterator](): IterableIterator<T>;
}

interface Array<T> {
  /**
   * Gets the length of the array. This is a number one higher than the highest element defined in an array.
   */
  readonly length: number;
  /** Iterator */
  [Symbol.iterator](): IterableIterator<T>;
  /**
   * Performs the specified action for each element in an array.
   * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
   * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  forEach(callbackfn: (value: T, index: number) => void): void;
  /**
   * Calls a defined callback function on each element of an array, and returns an array that contains the results.
   * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  map<U>(callbackfn: (value: T, index: number) => U): U[];
  /**
   * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
   */
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number) => T): T;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number) => T, initialValue: T): T;
  /**
   * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
   * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
   * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
   */
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;

  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
   */
  filter(callbackfn: (value: T, index: number) => any): T[];

  [n: number]: T;
}
interface ArrayConstructor {}
declare const Array: ArrayConstructor;

interface Map<K, V> {
  clear(): void;
  delete(key: K): boolean;
  get(key: K): V | undefined;
  set(key: K, value: V): this;
}
interface MapConstructor {
  new <K = any, V = any>(): Map<K, V>;
  readonly prototype: Map<any, any>;
}
declare var Map: MapConstructor;

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
