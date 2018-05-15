export interface CheckReadyOptions {
  rpcURLs: string[];
  offset: number;
  timeoutMS: number;
  checkEndpoints?: number;
}

export interface ServerOptions {
  keepAliveTimeout?: number;
}

export type ListenOptions =
  | {
      port: number;
      host: string;
    }
  | {
      key: string;
      cert: string;
      port: number;
      host: string;
    };

export interface RPCServerEnvironment {
  http?: {
    port: number;
    host: string;
  };
  https?: {
    key: string;
    cert: string;
    port: number;
    host: string;
  };
}

export interface RPCServerOptions {
  server?: ServerOptions;
  liveHealthCheck?: CheckReadyOptions;
  readyHealthCheck?: CheckReadyOptions;
}
