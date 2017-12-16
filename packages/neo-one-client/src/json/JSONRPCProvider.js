/* @flow */
// flowlint unclear-type:off
export type JSONRPCRequest = {|
  method: string,
  params?: any,
|};

export type JSONRPCResponse = any;

export interface JSONRPCProvider {
  request(req: JSONRPCRequest): Promise<JSONRPCResponse>;
}
