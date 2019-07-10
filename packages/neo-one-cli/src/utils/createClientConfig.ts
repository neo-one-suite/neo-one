import { Config } from '@neo-one/server-plugin';
import { Paths } from 'env-paths';

export interface ClientConfig {
  readonly paths: Omit<Paths, 'log'>;
}

export const createClientConfig = ({ paths }: ClientConfig): Config<ClientConfig> =>
  new Config({
    name: 'client',
    configPath: paths.config,
    defaultConfig: {
      paths,
    },
    schema: {
      type: 'object',
      required: ['paths'],
      properties: {
        paths: {
          type: 'object',
          required: ['data', 'config', 'cache', 'temp'],
          properties: {
            data: { type: 'string' },
            config: { type: 'string' },
            cache: { type: 'string' },
            temp: { type: 'string' },
          },
        },
      },
    },
  });
