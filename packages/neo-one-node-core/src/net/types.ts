export interface EndpointConfig {
  readonly type: 'tcp';
  readonly host: string;
  readonly port: number;
}

// type:host:port
export type Endpoint = string;

const SEP = '$$';
export const createEndpoint = ({ type, host, port }: EndpointConfig): Endpoint => [type, host, port].join(SEP);

export const getEndpointConfig = (endpoint: Endpoint): EndpointConfig => {
  const [type, host, port] = endpoint.split(SEP);

  // tslint:disable-next-line no-any
  return { type: type as any, host, port: parseInt(port, 10) };
};
