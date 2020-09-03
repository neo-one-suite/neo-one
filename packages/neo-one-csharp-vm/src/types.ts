// tslint:disable no-any

// TODO: not implemented
export type ExecutionContext = any;

// TODO: not implemented
export type Notifications = any;

export interface DispatchMethodNoArgs<Return = any> {
  readonly returnType: Return;
}

export interface DispatchMethodArgs<Return = any, Args = any> extends DispatchMethodNoArgs<Return> {
  readonly args: Args;
}

export type DispatchMethod<T = any, V = undefined> = V extends undefined
  ? DispatchMethodNoArgs<T>
  : DispatchMethodArgs<T, V>;

export interface DefaultMethods {
  readonly [k: string]: DispatchMethod<any, any>;
}

export type DispatcherFunc<Methods extends DefaultMethods> = <T extends keyof Methods>(
  input: Methods[T] extends DispatchMethodArgs
    ? { readonly method: T; readonly args: Methods[T]['args'] }
    : { readonly method: T },
) => Methods[T]['returnType'];
