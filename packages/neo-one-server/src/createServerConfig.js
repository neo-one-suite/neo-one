/* @flow */
import type { Log } from '@neo-one/utils';

import { SERVICES_SCHEMA } from './middleware';
import Config from './Config';
import type { ServerConfig } from './Server';

import paths from './paths';

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
      services: {},
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
      required: ['paths', 'log', 'server', 'services'],
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
        services: SERVICES_SCHEMA,
      },
    },
    log,
  });
