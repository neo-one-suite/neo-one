// tslint:disable no-any no-empty promise-must-complete
export interface Deferred<Value = any> {
  readonly resolve: (value: Value) => void;
  readonly reject: (error: Error) => void;
  readonly promise: Promise<Value>;
}

export const createDeferred = <Value>(): Deferred<Value> => {
  let resolve: (value: Value) => void = () => {};
  let reject: (error: Error) => void = () => {};
  const promise = new Promise<Value>((resolver, rejector) => {
    resolve = resolver;
    reject = rejector;
  });

  return { resolve, reject, promise };
};
