/* @flow */
export type NetworkType = 'main' | 'test' | 'private';

export type NodeSettings = {|
  type: NetworkType,
  isTestNet: boolean,
  utilityTokenAmount?: number,
  secondsPerBlock?: number,
  standbyValidators?: Array<string>,
  address?: string,
  rpcPort: number,
  listenTCPPort: number,
  consensus: {|
    enabled: boolean,
    options: {|
      privateKey: string,
    |},
  |},
  seeds: Array<string>,
  rpcEndpoints: Array<string>,
|};
