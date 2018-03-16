/* @flow */
import { type Paths, Config } from '@neo-one/server-plugin';

export type ClientConfig = {|
  paths: Paths,
  log: {|
    level: string,
    maxSize: number,
    maxFiles: number,
  |},
|};

export default ({ paths }: {| paths: Paths |}): Config<ClientConfig> =>
  new Config({
    name: 'client',
    configPath: paths.config,
    defaultConfig: {
      paths,
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
  });
