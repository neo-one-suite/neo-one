/* @flow */
import { Config, type DescribeTable } from '@neo-one/server-plugin';
import type { Monitor } from '@neo-one/monitor';

import _ from 'lodash';
import { take } from 'rxjs/operators';
import { utils } from '@neo-one/utils';

type Ports = {
  [plugin: string]: {
    [resourceType: string]: {
      [resource: string]: {
        [name: string]: number,
      },
    },
  },
};
type PortAllocatorConfig = {| ports: Ports |};
const createPortAllocatorConfig = ({
  dataPath,
}: {|
  dataPath: string,
|}): Config<PortAllocatorConfig> =>
  new Config({
    name: 'port_allocator',
    defaultConfig: { ports: {} },
    schema: {
      type: 'object',
      required: ['ports'],
      properties: {
        ports: {
          type: 'object',
          patternProperties: {
            '^.*$': {
              type: 'object',
              patternProperties: {
                '^.*$': {
                  type: 'object',
                  patternProperties: {
                    '^.*$': {
                      type: 'object',
                      patternProperties: {
                        '^.*$': { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    configPath: dataPath,
  });

export default class PortAllocator {
  _monitor: Monitor;
  _ports: Ports;
  _currentPort: number;
  _availablePorts: Array<number>;
  _config: Config<PortAllocatorConfig>;

  _persisting: boolean;
  _shouldPersist: boolean;

  constructor({
    monitor,
    ports,
    portMin,
    portMax,
    config,
  }: {|
    monitor: Monitor,
    ports: Ports,
    portMin: number,
    portMax: number,
    config: Config<PortAllocatorConfig>,
  |}) {
    this._monitor = monitor.at('port_allocator');

    let maxPort = -1;
    const filteredPorts = {};
    const allPorts = new Set();
    for (const [plugin, pluginPorts] of utils.entries(ports)) {
      const filteredResourceTypePorts = {};
      for (const pluginValue of utils.entries(pluginPorts)) {
        const [resourceType, resourceTypePorts] = pluginValue;
        const filteredResourcePorts = {};
        for (const resourceTypeValue of utils.entries(resourceTypePorts)) {
          const [resource, resourcePorts] = resourceTypeValue;
          const filteredNamePorts = {};
          for (const [name, port] of utils.entries(resourcePorts)) {
            if (portMin <= port && port <= portMax) {
              maxPort = Math.max(maxPort, port);
              filteredNamePorts[name] = port;
              allPorts.add(port);
            }
          }
          if (!_.isEmpty(filteredNamePorts)) {
            filteredResourcePorts[resource] = filteredNamePorts;
          }
        }
        if (!_.isEmpty(filteredResourcePorts)) {
          filteredResourceTypePorts[resourceType] = filteredResourcePorts;
        }
      }
      if (!_.isEmpty(filteredResourceTypePorts)) {
        filteredPorts[plugin] = filteredResourceTypePorts;
      }
    }

    this._ports = filteredPorts;
    this._currentPort = maxPort === -1 ? portMin : maxPort + 1;
    this._availablePorts = _.range(portMin, this._currentPort).filter(
      port => !allPorts.has(port),
    );
    this._config = config;

    this._persisting = false;
    this._shouldPersist = false;
    this._persist();
  }

  static async create({
    monitor,
    dataPath,
    portMin,
    portMax,
  }: {|
    monitor: Monitor,
    dataPath: string,
    portMin: number,
    portMax: number,
  |}): Promise<PortAllocator> {
    const config = createPortAllocatorConfig({ dataPath });
    const { ports } = await config.config$.pipe(take(1)).toPromise();
    return new PortAllocator({
      monitor,
      config,
      ports,
      portMin,
      portMax,
    });
  }

  releasePort({
    plugin,
    resourceType,
    resource,
    name,
  }: {|
    plugin: string,
    resourceType: string,
    resource: string,
    name?: string,
  |}): void {
    if (
      this._ports[plugin] != null &&
      this._ports[plugin][resourceType] != null &&
      this._ports[plugin][resourceType][resource] != null &&
      (name == null ||
        this._ports[plugin][resourceType][resource][name] != null)
    ) {
      if (name == null) {
        const ports = utils.values(this._ports[plugin][resourceType][resource]);
        this._availablePorts.push(...ports);
        delete this._ports[plugin][resourceType][resource];
      } else {
        const port = this._ports[plugin][resourceType][resource][name];
        this._availablePorts.push(port);
        delete this._ports[plugin][resourceType][resource][name];
      }
      if (_.isEmpty(this._ports[plugin][resourceType][resource])) {
        delete this._ports[plugin][resourceType][resource];
        if (_.isEmpty(this._ports[plugin][resourceType])) {
          delete this._ports[plugin][resourceType];
          if (_.isEmpty(this._ports[plugin])) {
            delete this._ports[plugin];
          }
        }
      }

      this._persist();
    }
  }

  allocatePort({
    plugin,
    resourceType,
    resource,
    name,
  }: {|
    plugin: string,
    resourceType: string,
    resource: string,
    name: string,
  |}): number {
    if (this._ports[plugin] == null) {
      this._ports[plugin] = {};
    }

    if (this._ports[plugin][resourceType] == null) {
      this._ports[plugin][resourceType] = {};
    }

    if (this._ports[plugin][resourceType][resource] == null) {
      this._ports[plugin][resourceType][resource] = {};
    }

    if (this._ports[plugin][resourceType][resource][name] == null) {
      this._ports[plugin][resourceType][resource][name] = this._getNextPort();
      this._persist();
    }

    return this._ports[plugin][resourceType][resource][name];
  }

  async _persist(): Promise<void> {
    if (this._persisting) {
      this._shouldPersist = true;
      return;
    }
    this._persisting = true;
    this._shouldPersist = false;

    try {
      await this._config.update({ config: { ports: this._ports } });
    } catch (error) {
      this._monitor.logError({
        name: 'neo_update_config_error',
        message: 'Failed to update config',
        error,
      });
    }

    this._persisting = false;
    if (this._shouldPersist) {
      this._persist();
    }
  }

  _getNextPort(): number {
    if (this._availablePorts.length > 0) {
      return this._availablePorts.shift();
    }

    const currentPort = this._currentPort;
    this._currentPort += 1;
    return currentPort;
  }

  getDebug(): DescribeTable {
    return [
      ['Config Path', this._config._configPath],
      ['Current Port', `${this._currentPort}`],
      ['Available Ports', JSON.stringify(this._availablePorts)],
      [
        'Ports',
        {
          type: 'list',
          table: [
            ['Plugin', 'Resource Type', 'Resource', 'Name', 'Port'],
          ].concat(
            utils
              .entries(this._ports)
              .reduce(
                (acc, [plugin, pluginPorts]) =>
                  acc.concat(
                    utils
                      .entries(pluginPorts)
                      .reduce(
                        (acc1, [resourceType, resourceTypePorts]) =>
                          acc1.concat(
                            utils
                              .entries(resourceTypePorts)
                              .reduce(
                                (acc2, [resource, resourcePorts]) =>
                                  acc2.concat(
                                    utils
                                      .entries(resourcePorts)
                                      .map(([name, port]) => [
                                        plugin,
                                        resourceType,
                                        resource,
                                        name,
                                        `${port}`,
                                      ]),
                                  ),
                                [],
                              ),
                          ),
                        [],
                      ),
                  ),
                [],
              ),
          ),
        },
      ],
    ];
  }
}
