/* @flow */
export type EndpointConfig = {|
  type: 'tcp',
  host: string,
  port: number,
|};

// type:host:port
export opaque type Endpoint: string = string;

const SEP = '$$';
export const createEndpoint = ({
  type,
  host,
  port,
}: EndpointConfig): Endpoint => [type, host, port].join(SEP);

export const getEndpointConfig = (endpoint: Endpoint): EndpointConfig => {
  const [type, host, port] = endpoint.split(SEP);
  return { type: (type: $FlowFixMe), host, port: parseInt(port, 10) };
};
