export interface EndpointConfig {
  readonly type: 'tcp';
  readonly host: string;
  readonly port: number;
}

// type:host:port
export type Endpoint = string;

export const createEndpoint = ({ type, host, port }: EndpointConfig): Endpoint => `${type}://${host}:${port}`;

export const getEndpointConfig = (endpoint: Endpoint): EndpointConfig => {
  const [type, host, port] = endpoint.split(':');

  // tslint:disable-next-line no-any
  return { type: type as any, host: host.slice(2), port: parseInt(port, 10) };
};
