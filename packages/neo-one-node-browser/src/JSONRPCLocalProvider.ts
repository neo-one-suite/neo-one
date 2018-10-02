import { JSONRPCProvider, JSONRPCRequest, JSONRPCResponse } from '@neo-one/client';
import { FullNode } from './FullNode';

// tslint:disable-next-line no-let
let startPromise: Promise<FullNode> | undefined;
const start = async () => {
  if (startPromise === undefined) {
    const node = new FullNode();
    startPromise = node.start().then(() => node);
  }

  return startPromise;
};

const handleRequest = async (req: JSONRPCRequest) => {
  const node = await start();
  const { watchTimeoutMS, params = [] } = req;

  return node.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: req.method,
    params: watchTimeoutMS === undefined ? params : params.concat([watchTimeoutMS]),
  });
};

export class JSONRPCLocalProvider extends JSONRPCProvider {
  public async request(req: JSONRPCRequest): Promise<JSONRPCResponse> {
    const response = await handleRequest(req);

    return this.handleResponse(response);
  }
}
