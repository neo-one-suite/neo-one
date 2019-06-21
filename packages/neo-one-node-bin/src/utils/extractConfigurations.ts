import { BackupEnvironment, BackupOptions } from '@neo-one/node';
import { RPCServerEnvironment, RPCServerOptions } from '@neo-one/node-http-rpc';
import { NetworkEnvironment, NetworkOptions } from '@neo-one/node-network';
import { NodeEnvironment, NodeOptions } from '@neo-one/node-protocol';
import _ from 'lodash';

const envKeys = {
  rpc: ['http', 'https', 'splashScreen'],
  backup: ['tmpPath', 'readyPath'],
  node: ['externalPort'],
  network: ['listenTCP'],
} as const;

const extractConfiguration = <T, V>(key: 'rpc' | 'backup' | 'node' | 'network') => (config: Partial<T & V>) => {
  const environment = _.pick(config, envKeys[key]) as T;
  const options = _.omit(config, Object.keys(environment)) as V;

  return {
    environment,
    options,
  };
};

export const extractRPCConfiguration = extractConfiguration<RPCServerEnvironment, RPCServerOptions>('rpc');
export const extractBackupConfiguration = extractConfiguration<BackupEnvironment, BackupOptions>('backup');
export const extractNodeConfiguration = extractConfiguration<NodeEnvironment, NodeOptions>('node');
export const extractNetworkConfiguration = extractConfiguration<NetworkEnvironment, NetworkOptions>('network');
