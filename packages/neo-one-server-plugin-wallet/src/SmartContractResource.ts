import { ABI } from '@neo-one/client';
import { compoundName, DescribeTable, PluginManager } from '@neo-one/server-plugin';
import { constants as compilerConstants, Contract } from '@neo-one/server-plugin-compiler';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Observable, ReplaySubject } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';
import { ABIRequiredError, ContractOrHashRequiredError, WalletRequiredError } from './errors';
import { SmartContract, SmartContractRegister, SmartContractResourceType } from './SmartContractResourceType';
import { getWallet } from './utils';

interface SmartContractResourceOptions {
  readonly resourceType: SmartContractResourceType;
  readonly name: string;
  readonly baseName: string;
  readonly networkName: string;
  readonly dataPath: string;
  readonly configPath: string;
  readonly abiPath: string;
  readonly hash: string;
  readonly contractName?: string;
  readonly abi: ABI;
}

interface NewSmartContractResourceOptions {
  readonly pluginManager: PluginManager;
  readonly resourceType: SmartContractResourceType;
  readonly name: string;
  readonly abi?: ABI;
  readonly contract?: {
    readonly name: string;
    readonly register: SmartContractRegister;
  };
  readonly hash?: string;
  readonly wallet?: string;
  readonly dataPath: string;
}

interface ExistingSmartContractResourceOptions {
  readonly pluginManager: PluginManager;
  readonly resourceType: SmartContractResourceType;
  readonly name: string;
  readonly dataPath: string;
}

const CONFIG_PATH = 'config.json';
const ABI_PATH = 'abi.json';

export class SmartContractResource {
  public static async createNew({
    pluginManager,
    resourceType,
    name,
    abi: abiIn,
    contract,
    hash: hashIn,
    wallet: walletName,
    dataPath,
  }: NewSmartContractResourceOptions): Promise<SmartContractResource> {
    const {
      name: baseName,
      names: [networkName],
    } = compoundName.extract(name);

    let address;
    let abi = abiIn;

    let contractName;
    if (contract !== undefined) {
      if (walletName === undefined) {
        throw new WalletRequiredError();
      }

      const compiledContract = await (pluginManager
        .getResourcesManager({
          plugin: compilerConstants.PLUGIN,
          resourceType: compilerConstants.CONTRACT_RESOURCE_TYPE,
        })
        .getResource$({
          name: contract.name,
          options: {},
        })
        .pipe(take(1))
        .toPromise() as Promise<Contract | undefined>);
      if (compiledContract === undefined) {
        throw new ContractOrHashRequiredError(`Contract ${contract.name} does not exist.`);
      }

      const { client, wallet } = await getWallet({
        pluginManager,
        walletName,
      });

      const result = await client.publish(
        {
          script: compiledContract.script,
          parameters: ['String', 'Array'],
          returnType: 'Buffer',
          name: contract.register.name,
          codeVersion: contract.register.codeVersion,
          author: contract.register.author,
          email: contract.register.email,
          description: contract.register.description,
          storage: compiledContract.hasStorage,
          dynamicInvoke: compiledContract.hasDynamicInvoke,
          payable: compiledContract.payable,
        },
        {
          from: wallet.accountID,
        },
      );

      const receipt = await result.confirmed();
      if (receipt.result.state === 'HALT') {
        ({ address } = receipt.result.value);
      } else {
        throw new Error(receipt.result.message);
      }

      contractName = contract.name;
      abi = compiledContract.abi;
    } else {
      if (hashIn === undefined) {
        throw new ContractOrHashRequiredError();
      }

      if (abi === undefined) {
        throw new ABIRequiredError();
      }

      address = hashIn;
    }

    const configPath = this.getConfigPath(dataPath);
    const abiPath = this.getABIPath(dataPath);

    return new SmartContractResource({
      resourceType,
      name,
      baseName,
      networkName,
      contractName,
      dataPath,
      configPath,
      abiPath,
      hash: address,
      abi,
    });
  }

  public static async createExisting({
    resourceType,
    name,
    dataPath,
  }: ExistingSmartContractResourceOptions): Promise<SmartContractResource> {
    const {
      name: baseName,
      names: [networkName],
    } = compoundName.extract(name);

    const configPath = this.getConfigPath(dataPath);
    const abiPath = this.getABIPath(dataPath);
    const [{ hash, contractName }, abi] = await Promise.all([fs.readJSON(configPath), fs.readJSON(abiPath)]);

    return new SmartContractResource({
      resourceType,
      name,
      baseName,
      networkName,
      contractName,
      dataPath,
      configPath,
      abiPath,
      hash,
      abi,
    });
  }

  private static getConfigPath(dataPath: string): string {
    return path.resolve(dataPath, CONFIG_PATH);
  }

  private static getABIPath(dataPath: string): string {
    return path.resolve(dataPath, ABI_PATH);
  }

  public readonly resource$: Observable<SmartContract>;
  private readonly resourceType: SmartContractResourceType;
  private readonly name: string;
  private readonly baseName: string;
  private readonly networkName: string;
  private readonly dataPath: string;
  private readonly configPath: string;
  private readonly abiPath: string;
  private readonly hash: string;
  private readonly contractName: string | undefined;
  private readonly abi: ABI;

  public constructor({
    resourceType,
    name,
    baseName,
    networkName,
    dataPath,
    configPath,
    abiPath,
    hash,
    contractName,
    abi,
  }: SmartContractResourceOptions) {
    this.resourceType = resourceType;
    this.name = name;
    this.baseName = baseName;
    this.networkName = networkName;
    this.dataPath = dataPath;
    this.configPath = configPath;
    this.abiPath = abiPath;
    this.hash = hash;
    this.contractName = contractName;
    this.abi = abi;

    const subject$ = new ReplaySubject<void>();
    this.resource$ = subject$.pipe(
      map(() => this.toResource()),
      shareReplay(1),
    );

    subject$.next();
  }

  public async create(): Promise<void> {
    await fs.ensureDir(this.dataPath);
    await Promise.all([
      fs.writeJSON(this.configPath, {
        hash: this.hash,
        contractName: this.contractName,
      }),

      fs.writeJSON(this.abiPath, JSON.stringify(this.abi)),
    ]);
  }

  public async delete(): Promise<void> {
    await fs.remove(this.dataPath);
  }

  public getDebug(): DescribeTable {
    const table: ReadonlyArray<[string, string]> = [
      ['Data Path', this.dataPath],
      ['Config Path', this.configPath],
      ['ABI Path', this.abiPath],
    ];

    return table.concat(
      Object.entries(this.toResource()).map<[string, string]>(([key, val]) => {
        if (val === undefined) {
          return [key, 'null'];
        }

        return [key, typeof val === 'string' ? val : JSON.stringify(val, undefined, 2)];
      }),
    );
  }

  private toResource(): SmartContract {
    return {
      plugin: this.resourceType.plugin.name,
      resourceType: this.resourceType.name,
      name: this.name,
      baseName: this.baseName,
      state: 'stopped',
      network: this.networkName,
      contractName: this.contractName,
      hash: this.hash,
      abi: this.abi,
    };
  }
}
