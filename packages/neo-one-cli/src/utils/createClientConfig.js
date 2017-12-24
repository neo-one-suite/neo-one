/* @flow */
import { Config, paths } from '@neo-one/server-plugin';
import type { Log } from '@neo-one/utils';

export type ClientConfig = {|
  paths: {|
    data: string,
    config: string,
    cache: string,
    log: string,
    temp: string,
  |},
  log: {|
    level: string,
    maxSize: number,
    maxFiles: number,
  |},
|};

export default ({ log }: {| log: Log |}): Config<ClientConfig> =>
  new Config({
    name: 'client',
    defaultConfig: {
      paths: {
        data: paths.data,
        config: paths.config,
        cache: paths.cache,
        log: paths.log,
        temp: paths.temp,
      },
      log: {
        level: 'info',
        maxSize: 10 * 1024 * 1024,
        maxFiles: 5,
      },
    },
    schema: {
      type: 'object',
      required: ['paths', 'log'],
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
        log: {
          type: 'object',
          required: ['level', 'maxSize', 'maxFiles'],
          properties: {
            level: { type: 'string' },
            maxSize: { type: 'number' },
            maxFiles: { type: 'number' },
          },
        },
      },
    },
    log,
  });
