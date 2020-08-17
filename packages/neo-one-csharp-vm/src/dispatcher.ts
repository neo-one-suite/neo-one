import { func, Params, Source, TSQL } from '@neo-one/edge';

type EdgeOptions = (() => void) | string | Params | Source | TSQL;

export interface DispatchMethod<Return = any, Args = undefined> {
  readonly returnType: Return;
  readonly args: Args;
}

export interface DefaultMethods {
  readonly [k: string]: DispatchMethod<any, any>;
}

export const createCSharpDispatchInvoke = <Methods extends DefaultMethods>(options: EdgeOptions) => {
  const invokeFunction = func<any, any>(options);

  return <T extends string>(
    input: Methods[T]['args'] extends undefined ? { method: T } : { method: T; args: Methods[T]['args'] },
  ) => invokeFunction(input, true) as Methods[T]['returnType'];
};
