import { ABI } from '@neo-one/client';
import { Binary, DescribeTable, TaskList } from '@neo-one/server-plugin';
import fs from 'fs-extra';
import path from 'path';
import { Observable, of as _of, ReplaySubject, Subject } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { compileSmartContract } from './compileSmartContract';
import { Contract, ContractResourceOptions, ContractResourceType } from './ContractResourceType';
import { ABIRequiredError } from './errors';

const ABI_PATH = 'abi.json';
const AVM_PATH = 'sc.avm';
const CONFIG_PATH = 'sc.json';

export interface ContractResourceAdapterInitOptions {
  readonly name: string;
  readonly dataPath: string;
  readonly binary: Binary;
  readonly resourceType: ContractResourceType;
}

export interface ContractResourceAdapterStaticOptions extends ContractResourceAdapterInitOptions {
  readonly avmPath: string;
  readonly abiPath: string;
  readonly configPath: string;
}

export interface ContractResourceAdapterOptions extends ContractResourceAdapterStaticOptions {
  readonly script: string;
  readonly abi: ABI;
  readonly hasStorage: boolean;
  readonly hasDynamicInvoke: boolean;
  readonly payable: boolean;
}

export class ContractResourceAdapter {
  public static async init(options: ContractResourceAdapterInitOptions): Promise<ContractResourceAdapter> {
    const staticOptions = this.getStaticOptions(options);
    const [abi, script, { hasStorage, hasDynamicInvoke, payable }] = await Promise.all([
      fs.readJSON(staticOptions.abiPath),
      fs.readFile(staticOptions.avmPath, 'hex'),
      fs.readJSON(staticOptions.configPath),
    ]);

    return new this({
      name: staticOptions.name,
      binary: staticOptions.binary,
      dataPath: staticOptions.dataPath,
      resourceType: staticOptions.resourceType,
      abiPath: staticOptions.abiPath,
      avmPath: staticOptions.avmPath,
      configPath: staticOptions.configPath,
      abi,
      script,
      hasStorage,
      hasDynamicInvoke,
      payable,
    });
  }

  public static create(adapterOptions: ContractResourceAdapterInitOptions, options: ContractResourceOptions): TaskList {
    const staticOptions = this.getStaticOptions(adapterOptions);

    return new TaskList({
      tasks: [
        {
          title: 'Create data directory',
          task: async () => {
            await fs.ensureDir(staticOptions.dataPath);
          },
        },

        {
          title: 'Compile smart contract',
          task: async (ctx) => {
            if (options.scPath === undefined) {
              throw new Error('Something went wrong, smart contract path was null.');
            }
            try {
              let { abi, hasStorage, hasDynamicInvoke, payable } = await compileSmartContract({
                scPath: options.scPath,
                avmPath: staticOptions.avmPath,
                binary: staticOptions.binary,
              });

              if (abi === undefined) {
                abi = options.abi;
              }

              if (abi === undefined) {
                throw new ABIRequiredError();
              }

              if (hasStorage === undefined) {
                hasStorage = options.hasStorage;
              }

              if (hasDynamicInvoke === undefined) {
                hasDynamicInvoke = options.hasDynamicInvoke;
              }

              if (payable === undefined) {
                ({ payable } = options);
              }

              const script = await fs.readFile(staticOptions.avmPath, 'hex');

              ctx.abi = abi;
              ctx.hasDynamicInvoke = hasDynamicInvoke;
              ctx.hasStorage = hasStorage;
              ctx.payable = payable;
              ctx.script = script;
            } catch (error) {
              await fs.remove(staticOptions.dataPath);
              throw error;
            }
          },
        },

        {
          title: 'Save ABI and configuration',
          task: async (ctx) => {
            const { abi, hasDynamicInvoke, hasStorage, payable, script } = ctx;
            await Promise.all([
              fs.writeJSON(staticOptions.abiPath, abi),
              fs.writeJSON(staticOptions.configPath, {
                hasDynamicInvoke,
                hasStorage,
                payable,
              }),
            ]);

            ctx.resourceAdapter = new this({
              name: staticOptions.name,
              binary: staticOptions.binary,
              dataPath: staticOptions.dataPath,
              resourceType: staticOptions.resourceType,
              abiPath: staticOptions.abiPath,
              avmPath: staticOptions.avmPath,
              configPath: staticOptions.configPath,
              script,
              abi,
              hasStorage,
              hasDynamicInvoke,
              payable,
            });

            ctx.dependencies = [];
          },
        },
      ],
    });
  }

  private static getStaticOptions(options: ContractResourceAdapterInitOptions): ContractResourceAdapterStaticOptions {
    return {
      name: options.name,
      binary: options.binary,
      dataPath: options.dataPath,
      resourceType: options.resourceType,
      abiPath: path.resolve(options.dataPath, ABI_PATH),
      avmPath: path.resolve(options.dataPath, AVM_PATH),
      configPath: path.resolve(options.dataPath, CONFIG_PATH),
    };
  }

  public readonly resource$: Observable<Contract>;
  private readonly name: string;
  private readonly dataPath: string;
  private readonly resourceType: ContractResourceType;
  private readonly avmPath: string;
  private readonly abiPath: string;
  private readonly configPath: string;
  private readonly script: string;
  private readonly abi: ABI;
  private readonly hasStorage: boolean;
  private readonly hasDynamicInvoke: boolean;
  private readonly payable: boolean;
  private readonly update$: Subject<void>;

  public constructor({
    name,
    dataPath,
    resourceType,
    avmPath,
    abiPath,
    configPath,
    script,
    abi,
    hasStorage,
    hasDynamicInvoke,
    payable,
  }: ContractResourceAdapterOptions) {
    this.name = name;
    this.dataPath = dataPath;
    this.resourceType = resourceType;
    this.avmPath = avmPath;
    this.abiPath = abiPath;
    this.configPath = configPath;
    this.script = script;
    this.abi = abi;
    this.hasStorage = hasStorage;
    this.hasDynamicInvoke = hasDynamicInvoke;
    this.payable = payable;

    this.update$ = new ReplaySubject(1);
    this.resource$ = this.update$.pipe(
      switchMap<void, Contract>(() =>
        _of({
          plugin: this.resourceType.plugin.name,
          resourceType: this.resourceType.name,
          name: this.name,
          baseName: this.name,
          state: 'stopped',
          avmPath: this.avmPath,
          script: this.script,
          abi: this.abi,
          hasStorage: this.hasStorage,
          hasDynamicInvoke: this.hasDynamicInvoke,
          payable: this.payable,
        }),
      ),
      shareReplay<Contract>(1),
    );

    this.update$.next();
  }

  public async destroy(): Promise<void> {
    // do nothing
  }

  public delete(_options: ContractResourceOptions): TaskList {
    return new TaskList({
      tasks: [
        {
          title: 'Clean local files',
          task: async () => {
            await fs.remove(this.dataPath);
          },
        },
      ],
    });
  }

  public start(_options: ContractResourceOptions): TaskList {
    throw new Error('Cannot be started');
  }

  public stop(_options: ContractResourceOptions): TaskList {
    throw new Error('Cannot be stopped');
  }

  public getDebug(): DescribeTable {
    return [
      ['Data Path', this.dataPath],
      ['AVM Path', this.avmPath],
      ['ABI Path', this.abiPath],
      ['Config Path', this.configPath],
      ['Storage', this.hasStorage ? 'Yes' : 'No'],
      ['Dynamic Invoke', this.hasDynamicInvoke ? 'Yes' : 'No'],
      ['Payable', this.payable ? 'Yes' : 'No'],
      ['ABI', JSON.stringify(this.abi, undefined, 2)],
    ];
  }
}
