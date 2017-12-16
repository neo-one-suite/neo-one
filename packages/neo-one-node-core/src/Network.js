/* @flow */
export type EndpointConfig = {|
  type: 'tcp',
  host: string,
  port: number,
|};

// type:host:port
export opaque type Endpoint: string = string;

export const createEndpoint = ({
  type,
  host,
  port,
}: EndpointConfig): Endpoint => `${type}:${host}:${port}`;

export const getEndpointConfig = (endpoint: Endpoint): EndpointConfig => {
  const [type, host, port] = endpoint.split(':');
  return { type: (type: $FlowFixMe), host, port: parseInt(port, 10) };
};
