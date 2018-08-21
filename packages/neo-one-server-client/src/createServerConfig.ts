import { Config } from '@neo-one/server-plugin';
import { Paths } from 'env-paths';

export interface ServerConfig {
  readonly paths: Paths;
  readonly server: {
    readonly port: number;
  };
  readonly httpServer: {
    readonly port: number;
  };
  readonly log: {
    readonly level: string;
    readonly maxSize: number;
    readonly maxFiles: number;
  };
  readonly ports: {
    readonly min: number;
    readonly max: number;
  };
}

export const createServerConfig = ({
  paths,
  serverPort,
  httpServerPort,
  minPort,
}: {
  readonly paths: Paths;
  readonly serverPort?: number;
  readonly httpServerPort?: number;
  readonly minPort?: number;
}): Config<ServerConfig> =>
  new Config({
    name: 'server',
    configPath: paths.config,
    defaultConfig: {
      paths,
      server: {
        port: serverPort === undefined ? 40100 : serverPort,
      },
      httpServer: {
        port: httpServerPort === undefined ? 40101 : httpServerPort,
      },
      log: {
        level: 'info',
        maxSize: 10 * 1024 * 1024,
        maxFiles: 5,
      },
      ports: {
        min: minPort === undefined ? 40200 : minPort,
        max: (minPort === undefined ? 40200 : minPort) + 1000,
      },
    },
    schema: {
      type: 'object',
      required: ['paths', 'log', 'server'],
      properties: {
        paths: {
          type: 'object',
          required: ['data', 'config', 'cache', 'log', 'temp'],
          properties: {
            data: { type: 'string' },
            config: { type: 'string' },
            cache: { type: 'string' },
            log: { type: 'string' },
            temp: { type: 'string' },
          },
        },
        server: {
          type: 'object',
          required: ['port'],
          properties: {
            port: { type: 'number' },
          },
        },
        httpServer: {
          type: 'object',
          required: ['port'],
          properties: {
            port: { type: 'number' },
          },
        },
        log: {
          type: 'object',
          required: ['level', 'maxSize', 'maxFiles'],
          properties: {
            level: { type: 'string' },
            maxSize: { type: 'number' },
            maxFiles: { type: 'number' },
          },
        },
        ports: {
          type: 'object',
          required: ['min', 'max'],
          properties: {
            min: { type: 'number' },
            max: { type: 'number' },
          },
        },
      },
    },
  });
