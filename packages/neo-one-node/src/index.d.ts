import { BackupRestoreOptions } from '@neo-one/node-data-backup';
import { Monitor } from '@neo-one/monitor';
import { NodeEnvironment, NodeOptions } from '@neo-one/node-protocol';
import { Observable } from 'rxjs';
import { RPCServerEnvironment, RPCServerOptions } from '@neo-one/node-rpc';
import { Settings } from '@neo-one/client-core';

export interface BackupEnvironment {
  tmpPath?: string;
  readyPath?: string;
}

export interface BackupOptions {
  restore: boolean;
  backup?: {
    cronSchedule: string;
  };
  options: BackupRestoreOptions;
}

export interface TelemetryEnvironment {
  port: number;
}

export interface Environment {
  dataPath: string;
  rpc: RPCServerEnvironment;
  levelDownOptions?: {
    createIfMissing?: boolean;
    errorIfExists?: boolean;
    compression?: boolean;
    cacheSize?: number;
    writeBufferSize?: number;
    blockSize?: number;
    maxOpenFiles?: number;
    blockRestartInterval?: number;
    maxFileSize?: number;
  };
  node?: NodeEnvironment;
  backup?: BackupEnvironment;
  telemetry?: TelemetryEnvironment;
}

export interface Options {
  node?: NodeOptions;
  rpc?: RPCServerOptions;
  backup?: BackupOptions;
}

export interface FullNodeOptions {
  monitor: Monitor;
  settings: Settings;
  environment: Environment;
  options$: Observable<Options>;
  chainFile?: string;
  dumpChainFile?: string;
  leveldown?: any;
}

export default class FullNode {
  public readonly dataPath: string;
  constructor(options: FullNodeOptions, onError?: (error: Error) => void);

  public start(): void;
  public stop(): void;
  public backup(options: BackupRestoreOptions): Promise<void>;
  public restore(options: BackupRestoreOptions): Promise<void>;
}
