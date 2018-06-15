import { Config, DescribeTable } from '@neo-one/server-plugin';
import { Monitor } from '@neo-one/monitor';
import _ from 'lodash';
import { take } from 'rxjs/operators';
import { utils } from '@neo-one/utils';

interface Ports {
  [plugin: string]: {
    [resourceType: string]: {
      [resource: string]: {
        [name: string]: number;
      };
    };
  };
}

interface PortAllocatorConfig {
  ports: Ports;
}
const createPortAllocatorConfig = ({ dataPath }: { dataPath: string }): Config<PortAllocatorConfig> =>
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

export class PortAllocator {
  private readonly monitor: Monitor;
  private readonly ports: Ports;
  private readonly currentPort: number;
  private readonly availablePorts: number[];
  private readonly config: Config<PortAllocatorConfig>;
  private readonly persisting: boolean;
  private readonly shouldPersist: boolean;

  constructor({
    monitor,
    ports,
    portMin,
    portMax,
    config,
  }: {
    monitor: Monitor;
    ports: Ports;
    portMin: number;
    portMax: number;
    config: Config<PortAllocatorConfig>;
  }) {
    this.monitor = monitor.at('port_allocator');

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

    this.ports = filteredPorts;
    this.currentPort = maxPort === -1 ? portMin : maxPort + 1;
    this.availablePorts = _.range(portMin, this.currentPort).filter((port) => !allPorts.has(port));

    this.config = config;

    this.persisting = false;
    this.shouldPersist = false;
    this.persist();
  }

  public static async create({
    monitor,
    dataPath,
    portMin,
    portMax,
  }: {
    monitor: Monitor;
    dataPath: string;
    portMin: number;
    portMax: number;
  }): Promise<PortAllocator> {
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

  public releasePort({
    plugin,
    resourceType,
    resource,
    name,
  }: {
    plugin: string;
    resourceType: string;
    resource: string;
    name?: string;
  }): void {
    if (
      this.ports[plugin] != null &&
      this.ports[plugin][resourceType] != null &&
      this.ports[plugin][resourceType][resource] != null &&
      (name == null || this.ports[plugin][resourceType][resource][name] != null)
    ) {
      if (name == null) {
        const ports = utils.values(this.ports[plugin][resourceType][resource]);
        this.availablePorts.push(...ports);
        delete this.ports[plugin][resourceType][resource];
      } else {
        const port = this.ports[plugin][resourceType][resource][name];
        this.availablePorts.push(port);
        delete this.ports[plugin][resourceType][resource][name];
      }
      if (_.isEmpty(this.ports[plugin][resourceType][resource])) {
        delete this.ports[plugin][resourceType][resource];
        if (_.isEmpty(this.ports[plugin][resourceType])) {
          delete this.ports[plugin][resourceType];
          if (_.isEmpty(this.ports[plugin])) {
            delete this.ports[plugin];
          }
        }
      }

      this.persist();
    }
  }

  public allocatePort({
    plugin,
    resourceType,
    resource,
    name,
  }: {
    plugin: string;
    resourceType: string;
    resource: string;
    name: string;
  }): number {
    if (this.ports[plugin] == null) {
      this.ports[plugin] = {};
    }

    if (this.ports[plugin][resourceType] == null) {
      this.ports[plugin][resourceType] = {};
    }

    if (this.ports[plugin][resourceType][resource] == null) {
      this.ports[plugin][resourceType][resource] = {};
    }

    if (this.ports[plugin][resourceType][resource][name] == null) {
      this.ports[plugin][resourceType][resource][name] = this.getNextPort();
      this.persist();
    }

    return this.ports[plugin][resourceType][resource][name];
  }

  private async persist(): Promise<void> {
    if (this.persisting) {
      this.shouldPersist = true;
      return;
    }
    this.persisting = true;
    this.shouldPersist = false;

    try {
      await this.config.update({ config: { ports: this.ports } });
    } catch (error) {
      this.monitor.logError({
        name: 'neo_update_config_error',
        message: 'Failed to update config',
        error,
      });
    }

    this.persisting = false;
    if (this.shouldPersist) {
      this.persist();
    }
  }

  private getNextPort(): number {
    if (this.availablePorts.length > 0) {
      return this.availablePorts.shift();
    }

    const currentPort = this.currentPort;
    this.currentPort += 1;
    return currentPort;
  }

  public getDebug(): DescribeTable {
    return [
      ['Config Path', this.config.configPath],
      ['Current Port', `${this.currentPort}`],
      ['Available Ports', JSON.stringify(this.availablePorts)],
      [
        'Ports',
        {
          type: 'list',
          table: [['Plugin', 'Resource Type', 'Resource', 'Name', 'Port']].concat(
            utils.entries(this.ports).reduce(
              (acc, [plugin, pluginPorts]) =>
                acc.concat(
                  utils.entries(pluginPorts).reduce(
                    (acc1, [resourceType, resourceTypePorts]) =>
                      acc1.concat(
                        utils.entries(resourceTypePorts).reduce(
                          (acc2, [resource, resourcePorts]) =>
                            acc2.concat(
                              utils
                                .entries(resourcePorts)
                                .map(([name, port]) => [plugin, resourceType, resource, name, `${port}`]),
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
