import { Monitor } from '@neo-one/monitor';

export interface JSONRPCRequest {
  readonly method: string;
  // tslint:disable-next-line no-any
  readonly params?: any;
  readonly watchTimeoutMS?: number;
}

// tslint:disable-next-line no-any
export type JSONRPCResponse = any;

export interface JSONRPCProvider {
  readonly request: (req: JSONRPCRequest, monitor?: Monitor) => Promise<JSONRPCResponse>;
}
