export interface EndpointConfig {
  readonly type: 'tcp';
  readonly host: string;
  readonly port: number;
}

// type:host:port
export type Endpoint = string;

export const createEndpoint = ({ type, host, port }: EndpointConfig): Endpoint => `${type}://${host}:${port}`;

export const getEndpointConfig = (endpoint: Endpoint): EndpointConfig => {
  const result = /([a-zA-Z]+):\/\/(.*):(\d+)/gu.exec(endpoint);
  if (result === null) {
    throw new Error(`Invalid endpoint: ${endpoint}`);
  }
  const [type, host, port] = result.slice(1);

  // tslint:disable-next-line no-any
  return { type: type as any, host, port: parseInt(port, 10) };
};
