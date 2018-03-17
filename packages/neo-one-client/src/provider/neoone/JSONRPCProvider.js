/* @flow */
import type { Monitor } from '@neo-one/monitor';

export type JSONRPCRequest = {|
  method: string,
  params?: any,
  watchTimeoutMS?: number,
|};

export type JSONRPCResponse = any;

export interface JSONRPCProvider {
  request(req: JSONRPCRequest, monitor?: Monitor): Promise<JSONRPCResponse>;
}
