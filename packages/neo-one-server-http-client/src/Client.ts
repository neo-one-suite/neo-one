import fetch from 'cross-fetch';

interface RPCRequest {
  readonly method: string;
  // tslint:disable-next-line no-any
  readonly [key: string]: any;
}

interface RPCResult {
  readonly type: 'ok' | 'error';
  // tslint:disable-next-line no-any
  readonly [key: string]: any;
}

/**
 * Client which makes http requests to the local NEO•ONE toolchain.
 */
export class Client {
  private readonly port: number;
  private readonly host: string;

  public constructor(port: number, host = 'localhost') {
    this.port = port;
    this.host = host;
  }

  public async ready(): Promise<RPCResult> {
    return this.requestInternal({ method: 'ready' });
  }

  public async request({ plugin, options }: { readonly plugin: string; readonly options: object }): Promise<RPCResult> {
    return this.requestInternal({
      method: 'request',
      plugin,
      options,
    });
  }

  public async executeTaskList({
    plugin,
    options,
  }: {
    readonly plugin: string;
    readonly options: object;
  }): Promise<RPCResult> {
    return this.requestInternal({
      method: 'executeTaskList',
      plugin,
      options,
    });
  }

  private async requestInternal(req: RPCRequest): Promise<RPCResult> {
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await fetch(`http://${this.host}:${this.port}/rpc`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      let text;
      try {
        // eslint-disable-next-line
        text = await response.text();
      } catch {
        // Ignore errors
      }
      throw new Error(`${response.status}: ${text}`);
    }
    // eslint-disable-next-line
    const result = await response.json();

    if (result.type === 'error') {
      throw new Error(result.message);
    }

    return result;
  }
}
