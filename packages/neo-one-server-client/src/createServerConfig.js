/* @flow */
import { Config, paths } from '@neo-one/server-plugin';
import type { Log } from '@neo-one/utils';

export type ServerConfig = {|
  paths: {|
    data: string,
    config: string,
    cache: string,
    log: string,
    temp: string,
  |},
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

export default ({ log }: {| log: Log |}): Config<ServerConfig> =>
  new Config({
    name: 'server',
    defaultConfig: {
      paths: {
        data: paths.data,
        config: paths.config,
        cache: paths.cache,
        log: paths.log,
        temp: paths.temp,
      },
      server: {
        port: 40100,
      },
      log: {
        level: 'info',
        maxSize: 10 * 1024 * 1024,
        maxFiles: 5,
      },
      ports: {
        min: 40200,
        max: 41200,
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
    log,
  });
