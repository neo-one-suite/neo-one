export type NetworkType = 'main' | 'test' | 'private';

export interface NodeSettings {
  readonly type: NetworkType;
  readonly isTestNet: boolean;
  readonly privateNet?: boolean;
  readonly secondsPerBlock?: number;
  readonly standbyValidators?: ReadonlyArray<string>;
  readonly address?: string;
  readonly rpcPort: number;
  readonly listenTCPPort: number;
  readonly telemetryPort: number;
  readonly consensus: {
    readonly enabled: boolean;
    readonly options: {
      readonly privateKey: string;
      readonly privateNet: boolean;
    };
  };

  readonly seeds: ReadonlyArray<string>;
  readonly rpcEndpoints: ReadonlyArray<string>;
}
