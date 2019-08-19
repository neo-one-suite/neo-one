import {
  DeveloperClient,
  JSONRPCProvider,
  JSONRPCRequest,
  JSONRPCResponse,
  NEOONEDataProvider,
} from '@neo-one/client-core';
import { constants } from '@neo-one/utils';
import { FullNode, FullNodeOptions } from './FullNode';

// tslint:disable-next-line no-let
let startPromise: Promise<FullNode> | undefined;
const start = async (options: FullNodeOptions, provider: JSONRPCLocalProvider, build: () => Promise<void>) => {
  if (startPromise === undefined) {
    const node = new FullNode(
      options,
      new DeveloperClient(new NEOONEDataProvider({ network: constants.LOCAL_NETWORK_NAME, rpcURL: provider })),
      build,
    );
    startPromise = node.start().then(() => node);
  }

  return startPromise;
};

const handleRequest = async (
  options: FullNodeOptions,
  provider: JSONRPCLocalProvider,
  build: () => Promise<void>,
  req: JSONRPCRequest,
) => {
  const node = await start(options, provider, build);
  const { watchTimeoutMS, params = [] } = req;

  return node.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: req.method,
    params: watchTimeoutMS === undefined ? params : params.concat([watchTimeoutMS]),
  });
};

export interface JSONRPCLocalProviderOptions {
  readonly options: FullNodeOptions;
  readonly build: () => Promise<void>;
}

export class JSONRPCLocalProvider extends JSONRPCProvider {
  public constructor(private readonly options: JSONRPCLocalProviderOptions) {
    super();
  }

  public async request(req: JSONRPCRequest): Promise<JSONRPCResponse> {
    // Something weird with comlink causes the property to be wrapped in a function, so we do this as a workaround.
    const options = await this.getOptions();
    const response = await handleRequest(options.options, this, options.build, req);

    return this.handleResponse(response);
  }

  private async getOptions(): Promise<JSONRPCLocalProviderOptions> {
    return this.options;
  }
}
