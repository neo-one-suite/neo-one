/* @flow */
import { type Paths, Config } from '@neo-one/server-plugin';

export type ServerConfig = {|
  paths: Paths,
  server: {|
    port: number,
  |},
  log: {|
    level: string,
    maxSize: number,
    maxFiles: number,
  |},
  ports: {|
    min: number,
    max: number,
  |},
|};

export default ({
  paths,
  serverPort,
  minPort,
}: {|
  paths: Paths,
  serverPort?: number,
  minPort?: number,
|}): Config<ServerConfig> =>
  new Config({
    name: 'server',
    configPath: paths.config,
    defaultConfig: {
      paths,
      server: {
        port: serverPort == null ? 40100 : serverPort,
      },
      log: {
        level: 'info',
        maxSize: 10 * 1024 * 1024,
        maxFiles: 5,
      },
      ports: {
        min: minPort == null ? 40200 : minPort,
        max: (minPort == null ? 40200 : minPort) + 1000,
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
