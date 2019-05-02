// tslint:disable readonly-keyword no-loop-statement no-object-mutation no-dynamic-delete
import { Monitor } from '@neo-one/monitor';
import { Config, DescribeTable, PortAllocator as IPortAllocator } from '@neo-one/server-plugin';
import _ from 'lodash';
import { take } from 'rxjs/operators';

interface NamePorts {
  [name: string]: number;
}

interface ResourcePorts {
  [resource: string]: NamePorts;
}

interface PluginPorts {
  [resourceType: string]: ResourcePorts;
}

interface Ports {
  [plugin: string]: PluginPorts;
}

interface PortAllocatorConfig {
  readonly ports: Ports;
}

const createPortAllocatorConfig = ({ dataPath }: { readonly dataPath: string }): Config<PortAllocatorConfig> =>
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

export class PortAllocator implements IPortAllocator {
  public static async create({
    monitor,
    dataPath,
    portMin,
    portMax,
  }: {
    readonly monitor: Monitor;
    readonly dataPath: string;
    readonly portMin: number;
    readonly portMax: number;
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

  private readonly monitor: Monitor;
  private readonly mutablePorts: Ports;
  private mutableCurrentPort: number;
  private readonly mutableAvailablePorts: number[];
  private readonly config: Config<PortAllocatorConfig>;
  private mutablePersisting: boolean;
  private mutableShouldPersist: boolean;

  public constructor({
    monitor,
    ports,
    portMin,
    portMax,
    config,
  }: {
    readonly monitor: Monitor;
    readonly ports: Ports;
    readonly portMin: number;
    readonly portMax: number;
    readonly config: Config<PortAllocatorConfig>;
  }) {
    this.monitor = monitor.at('port_allocator');

    // tslint:disable-next-line no-let
    let maxPort = -1;
    const filteredPorts: Ports = {};
    const allPorts = new Set();
    for (const [plugin, pluginPorts] of Object.entries(ports)) {
      const filteredResourceTypePorts: PluginPorts = {};
      for (const pluginValue of Object.entries(pluginPorts)) {
        const [resourceType, resourceTypePorts] = pluginValue;
        const filteredResourcePorts: ResourcePorts = {};
        for (const resourceTypeValue of Object.entries(resourceTypePorts)) {
          const [resource, resourcePorts] = resourceTypeValue;
          const filteredNamePorts: NamePorts = {};
          for (const [name, port] of Object.entries(resourcePorts)) {
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

    this.mutablePorts = filteredPorts;
    this.mutableCurrentPort = maxPort === -1 ? portMin : maxPort + 1;
    this.mutableAvailablePorts = _.range(portMin, this.mutableCurrentPort).filter((port) => !allPorts.has(port));

    this.config = config;

    this.mutablePersisting = false;
    this.mutableShouldPersist = false;
    // tslint:disable-next-line no-floating-promises
    this.persist();
  }

  public releasePort({
    plugin,
    resourceType,
    resource,
    name,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly resource: string;
    readonly name?: string;
  }): void {
    if (
      (this.mutablePorts[plugin] as PluginPorts | undefined) !== undefined &&
      (this.mutablePorts[plugin][resourceType] as ResourcePorts | undefined) !== undefined &&
      (this.mutablePorts[plugin][resourceType][resource] as NamePorts | undefined) !== undefined &&
      (name === undefined ||
        (this.mutablePorts[plugin][resourceType][resource][name] as number | undefined) !== undefined)
    ) {
      if (name === undefined) {
        const ports = Object.values(this.mutablePorts[plugin][resourceType][resource]);
        this.mutableAvailablePorts.push(...ports);
        delete this.mutablePorts[plugin][resourceType][resource];
      } else {
        const port = this.mutablePorts[plugin][resourceType][resource][name];
        this.mutableAvailablePorts.push(port);
        delete this.mutablePorts[plugin][resourceType][resource][name];
      }
      if (_.isEmpty(this.mutablePorts[plugin][resourceType][resource])) {
        delete this.mutablePorts[plugin][resourceType][resource];
        if (_.isEmpty(this.mutablePorts[plugin][resourceType])) {
          delete this.mutablePorts[plugin][resourceType];
          if (_.isEmpty(this.mutablePorts[plugin])) {
            delete this.mutablePorts[plugin];
          }
        }
      }

      // tslint:disable-next-line no-floating-promises
      this.persist();
    }
  }

  public allocatePort({
    plugin,
    resourceType,
    resource,
    name,
  }: {
    readonly plugin: string;
    readonly resourceType: string;
    readonly resource: string;
    readonly name: string;
  }): number {
    if ((this.mutablePorts[plugin] as PluginPorts | undefined) === undefined) {
      this.mutablePorts[plugin] = {};
    }

    if ((this.mutablePorts[plugin][resourceType] as ResourcePorts | undefined) === undefined) {
      this.mutablePorts[plugin][resourceType] = {};
    }

    if ((this.mutablePorts[plugin][resourceType][resource] as NamePorts | undefined) === undefined) {
      this.mutablePorts[plugin][resourceType][resource] = {};
    }

    if ((this.mutablePorts[plugin][resourceType][resource][name] as number | undefined) === undefined) {
      this.mutablePorts[plugin][resourceType][resource][name] = this.getNextPort();
      // tslint:disable-next-line no-floating-promises
      this.persist();
    }

    return this.mutablePorts[plugin][resourceType][resource][name];
  }

  public getDebug(): DescribeTable {
    return [
      ['Config Path', this.config.configPath],
      ['Current Port', `${this.mutableCurrentPort}`],
      ['Available Ports', JSON.stringify(this.mutableAvailablePorts)],
      [
        'Ports',
        {
          type: 'list',
          table: [['Plugin', 'Resource Type', 'Resource', 'Name', 'Port']].concat(
            Object.entries(this.mutablePorts).reduce<readonly (readonly [string, string, string, string, string])[]>(
              (acc, [plugin, pluginPorts]) =>
                acc.concat(
                  Object.entries(pluginPorts).reduce<readonly (readonly [string, string, string, string, string])[]>(
                    (acc1, [resourceType, resourceTypePorts]) =>
                      acc1.concat(
                        Object.entries(resourceTypePorts).reduce<
                          readonly (readonly [string, string, string, string, string])[]
                        >(
                          (acc2, [resource, resourcePorts]) =>
                            acc2.concat(
                              Object.entries(resourcePorts).map<[string, string, string, string, string]>(
                                ([name, port]) => [plugin, resourceType, resource, name, `${port}`],
                              ),
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

  private async persist(): Promise<void> {
    if (this.mutablePersisting) {
      this.mutableShouldPersist = true;

      return;
    }
    this.mutablePersisting = true;
    this.mutableShouldPersist = false;

    try {
      await this.config.update({ config: { ports: this.mutablePorts } });
    } catch (error) {
      this.monitor.logError({
        name: 'neo_update_config_error',
        message: 'Failed to update config',
        error,
      });
    }

    this.mutablePersisting = false;
    if (this.mutableShouldPersist) {
      await this.persist();
    }
  }

  private getNextPort(): number {
    if (this.mutableAvailablePorts.length > 0) {
      return this.mutableAvailablePorts.shift() as number;
    }

    const currentPort = this.mutableCurrentPort;
    this.mutableCurrentPort += 1;

    return currentPort;
  }
}
