export enum NetworkType {
  Main = 'main',
  Test = 'test',
  Private = 'private',
}

export interface NodeSettings {
  readonly type: NetworkType;
  readonly isTestNet?: boolean;
  readonly privateNet?: boolean;
  readonly secondsPerBlock?: number;
  readonly standbyValidators?: readonly string[];
  readonly address?: string;
  readonly rpcPort: number;
  readonly listenTCPPort: number;
  readonly telemetryPort: number;
  readonly consensus?: {
    readonly privateKey: string;
    readonly privateNet: boolean;
  };

  readonly seeds: readonly string[];
  readonly rpcEndpoints: readonly string[];
}
