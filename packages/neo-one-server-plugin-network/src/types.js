/* @flow */
export type NetworkType = 'main' | 'test' | 'private';

export type NodeSettings = {|
  type: NetworkType,
  isTestNet: boolean,
  privateNet?: boolean,
  secondsPerBlock?: number,
  standbyValidators?: Array<string>,
  address?: string,
  rpcPort: number,
  listenTCPPort: number,
  telemetryPort: number,
  consensus: {|
    enabled: boolean,
    options: {|
      privateKey: string,
      privateNet: boolean,
    |},
  |},
  seeds: Array<string>,
  rpcEndpoints: Array<string>,
|};
