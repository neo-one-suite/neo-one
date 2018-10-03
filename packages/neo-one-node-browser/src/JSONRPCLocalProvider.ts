import { JSONRPCProvider, JSONRPCRequest, JSONRPCResponse } from '@neo-one/client';
import { FullNode, FullNodeOptions } from './FullNode';

// tslint:disable-next-line no-let
let startPromise: Promise<FullNode> | undefined;
const start = async (options: FullNodeOptions) => {
  if (startPromise === undefined) {
    const node = new FullNode(options);
    startPromise = node.start().then(() => node);
  }

  return startPromise;
};

const handleRequest = async (options: FullNodeOptions, req: JSONRPCRequest) => {
  const node = await start(options);
  const { watchTimeoutMS, params = [] } = req;

  return node.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: req.method,
    params: watchTimeoutMS === undefined ? params : params.concat([watchTimeoutMS]),
  });
};

export interface JSONRPCLocalProviderOptions {
  readonly id: string;
}

export class JSONRPCLocalProvider extends JSONRPCProvider {
  public constructor(private readonly options: FullNodeOptions) {
    super();
  }

  public async request(req: JSONRPCRequest): Promise<JSONRPCResponse> {
    // Something weird with comlink causes the property to be wrapped in a function, so we do this as a workaround.
    const options = await this.getOptions();
    const response = await handleRequest(options, req);

    return this.handleResponse(response);
  }

  private async getOptions(): Promise<FullNodeOptions> {
    return this.options;
  }
}
