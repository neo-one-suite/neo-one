import * as comlink from './comlink';

export type EndpointLike = comlink.Endpoint | Window | Worker;
export interface Disposable {
  readonly dispose: () => void;
}
// tslint:disable-next-line no-any
export type WorkerConstructor = new (options: any) => any;
// tslint:disable-next-line no-any no-unused
export type WorkerInstance<T> = T extends new (options: any) => infer TInstance ? TInstance : never;
// tslint:disable-next-line no-any no-unused
export type WorkerOptions<T> = T extends new (options: infer TOptions) => any ? TOptions : never;
