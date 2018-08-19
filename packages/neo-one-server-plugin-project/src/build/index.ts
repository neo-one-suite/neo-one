import { scriptHashToAddress, SmartContractNetworksDefinition, SourceMaps } from '@neo-one/client';
import { common, crypto } from '@neo-one/client-core';
import { PluginManager, TaskList } from '@neo-one/server-plugin';
import { constants as networkConstants, Network } from '@neo-one/server-plugin-network';
import { constants as walletConstants, Wallet } from '@neo-one/server-plugin-wallet';
import { NetworkDefinition } from '@neo-one/smart-contract-codegen';
import { Contracts as ContractPaths } from '@neo-one/smart-contract-compiler';
import { utils } from '@neo-one/utils';
import * as path from 'path';
import { filter, take } from 'rxjs/operators';
import { DiagnosticCategory } from 'typescript';
import { constants } from '../constants';
import { loadProject } from '../loadProject';
import { BuildTaskListOptions, ProjectConfig } from '../types';
import { compileContract } from './compileContract';
import { deployContract } from './deployContract';
import { findContracts } from './findContracts';
import { generateCode } from './generateCode';
import { CommonCodeContract, generateCommonCode } from './generateCommonCode';

// tslint:disable-next-line readonly-array
type Contracts = CommonCodeContract[];
interface SmartContractNetworksDefinitions {
  // tslint:disable-next-line readonly-keyword
  [contractName: string]: SmartContractNetworksDefinition;
}

// tslint:disable no-any
const getProject = (ctx: any): ProjectConfig => ctx.project;
const getProjectName = (ctx: any): string => ctx.projectName;
const getContractPaths = (ctx: any): ContractPaths => ctx.contractPaths;
const getContracts = (ctx: any): Contracts => ctx.contracts;
const getSmartContractNetworksDefinitions = (ctx: any): SmartContractNetworksDefinitions =>
  ctx.smartContractNetworkDefinitions;
const getNetworkDefinitions = (ctx: any): ReadonlyArray<NetworkDefinition> => ctx.networkDefinitions;
const getWallet = (ctx: any): Wallet => ctx.wallet;
const getNetworkMaybe = (ctx: any): Network | undefined => ctx.networkMaybe;
const getNetwork = (ctx: any): Network => ctx.network;
// tslint:enable no-any

const getNetworkName = (projectName: string) => `${projectName}-local`;
const getNetworkResourceManager = (pluginManager: PluginManager) =>
  pluginManager.getResourcesManager({
    plugin: networkConstants.PLUGIN,
    resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
  });
const getWalletResourceManager = (pluginManager: PluginManager) =>
  pluginManager.getResourcesManager({
    plugin: walletConstants.PLUGIN,
    resourceType: walletConstants.WALLET_RESOURCE_TYPE,
  });

// tslint:disable-next-line export-name
export const build = (pluginManager: PluginManager, options: BuildTaskListOptions): TaskList =>
  new TaskList({
    tasks: [
      {
        title: 'Load project configuration',
        task: async (ctx) => {
          ctx.project = await loadProject(options.rootDir);
          ctx.projectName = path.basename(options.rootDir);
        },
      },
      {
        title: 'Find contracts',
        task: async (ctx) => {
          ctx.contractPaths = await findContracts(getProject(ctx));
        },
      },
      {
        title: 'Deploy dev contracts',
        task: () =>
          new TaskList({
            tasks: [
              {
                title: 'Ensure development network',
                task: () =>
                  new TaskList({
                    tasks: [
                      {
                        title: 'Check for existing network',
                        task: async (ctx) => {
                          const network = await getNetworkResourceManager(pluginManager)
                            .getResource$({ name: getNetworkName(getProjectName(ctx)), options: {} })
                            .pipe(take(1))
                            .toPromise();

                          ctx.networkMaybe = network;
                        },
                      },
                      {
                        title: 'Create network',
                        skip: (ctx) => {
                          if (getNetworkMaybe(ctx) !== undefined) {
                            return 'Network exists';
                          }

                          return false;
                        },
                        task: (ctx) =>
                          getNetworkResourceManager(pluginManager).create(getNetworkName(getProjectName(ctx)), {}),
                      },
                      {
                        title: 'Gather network information',
                        task: async (ctx) => {
                          const networkName = getNetworkName(getProjectName(ctx));
                          const [network, wallet] = await Promise.all([
                            getNetworkResourceManager(pluginManager)
                              .getResource$({ name: networkName, options: {} })
                              .pipe(
                                filter(utils.notNull),
                                take(1),
                              )
                              .toPromise() as Promise<Network>,
                            getWalletResourceManager(pluginManager)
                              .getResource$({
                                name: walletConstants.makeMasterWallet(networkName),
                                options: { network: networkName },
                              })
                              .pipe(
                                filter(utils.notNull),
                                take(1),
                              )
                              .toPromise() as Promise<Network>,
                          ]);

                          ctx.network = network;
                          ctx.wallet = wallet;
                          ctx.networkDefinitions = [
                            {
                              name: constants.LOCAL_NETWORK_NAME,
                              rpcURL: network.nodes[0].rpcAddress,
                            },
                          ];
                        },
                      },
                    ],
                  }),
              },
              {
                title: 'Deploy',
                task: (ctx) => {
                  ctx.smartContractNetworkDefinitions = {};
                  ctx.contracts = [];
                  const mutableLinked: { [filePath: string]: { [name: string]: string } } = {};
                  const mutableSourceMaps: Modifiable<SourceMaps> = {};

                  return new TaskList({
                    tasks: getContractPaths(ctx).map((contractPath) => ({
                      title: `Deploy ${contractPath.name}`,
                      task: async () => {
                        const contract = await compileContract(contractPath.filePath, contractPath.name, mutableLinked);

                        if (
                          contract.diagnostics.some((diagnostic) => diagnostic.category === DiagnosticCategory.Error)
                        ) {
                          throw new Error('Compilation error.');
                        }

                        const network = getNetwork(ctx);
                        const address = scriptHashToAddress(
                          common.uInt160ToString(crypto.toScriptHash(Buffer.from(contract.contract.script, 'hex'))),
                        );
                        mutableSourceMaps[address] = contract.sourceMap;
                        const [prodNetworksDefinition] = await Promise.all<SmartContractNetworksDefinition, string>([
                          Promise.resolve({}),
                          deployContract(network, contract, mutableSourceMaps),
                        ]);

                        mutableLinked[contractPath.filePath] = { [contractPath.name]: address };

                        // tslint:disable-next-line no-array-mutation
                        getContracts(ctx).push({
                          ...contract,
                          addresses: [address].concat(
                            Object.values(prodNetworksDefinition).map(({ address: value }) => value),
                          ),
                        });

                        // tslint:disable-next-line no-object-mutation
                        getSmartContractNetworksDefinitions(ctx)[contract.name] = {
                          ...prodNetworksDefinition,
                          [constants.LOCAL_NETWORK_NAME]: { address },
                        };
                      },
                    })),
                  });
                },
              },
            ],
          }),
      },
      {
        title: 'Synchronize project',
        task: () =>
          new TaskList({
            concurrent: true,
            tasks: [
              {
                title: 'Generate code',
                task: (ctx) =>
                  new TaskList({
                    concurrent: true,
                    tasks: getContracts(ctx)
                      .filter(({ name }) => {
                        const networksDefinition = getSmartContractNetworksDefinitions(ctx)[name] as
                          | SmartContractNetworksDefinition
                          | undefined;

                        return networksDefinition !== undefined;
                      })
                      .map((contract) => ({
                        title: `Generate ${contract.name} code`,
                        task: async () => {
                          const project = getProject(ctx);
                          const networksDefinition = getSmartContractNetworksDefinitions(ctx)[contract.name];

                          await generateCode(project, contract, networksDefinition, options.javascript);
                        },
                      }))
                      .concat([
                        {
                          title: 'Generate common code',
                          task: async () => {
                            await generateCommonCode(
                              getProject(ctx),
                              getContracts(ctx),
                              constants.LOCAL_NETWORK_NAME,
                              // tslint:disable-next-line no-non-null-assertion
                              getWallet(ctx).wif!,
                              getNetworkDefinitions(ctx),
                              options.javascript,
                            );
                          },
                        },
                      ]),
                  }),
              },
            ],
          }),
      },
    ],
  });
