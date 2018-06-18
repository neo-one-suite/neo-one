import { Config } from '@neo-one/server-plugin';
import { Paths } from 'env-paths';
export interface ClientConfig {
  readonly paths: Paths;
  readonly log: {
    readonly level: string;
    readonly maxSize: number;
    readonly maxFiles: number;
  };
}

export const createClientConfig = ({ paths }: { readonly paths: Paths }): Config<ClientConfig> =>
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
