import { scriptHashToAddress, SmartContractNetworksDefinition, SourceMaps } from '@neo-one/client';
import { common, crypto } from '@neo-one/client-core';
import { PluginManager, TaskList } from '@neo-one/server-plugin';
import { getNetworkResourceManager, Network } from '@neo-one/server-plugin-network';
import { constants as walletConstants, getWalletResourceManager, Wallet } from '@neo-one/server-plugin-wallet';
import { NetworkDefinition } from '@neo-one/smart-contract-codegen';
import { Contracts as ContractPaths } from '@neo-one/smart-contract-compiler';
import { utils } from '@neo-one/utils';
import { filter, take } from 'rxjs/operators';
import { DiagnosticCategory } from 'typescript';
import v4 from 'uuid/v4';
import { constants } from '../constants';
import { BuildTaskListOptions, ProjectConfig } from '../types';
import { getLocalNetworkName, getProjectResourceManager, loadProjectConfig, loadProjectID } from '../utils';
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
const getProjectConfig = (ctx: any): ProjectConfig => ctx.projectConfig;
const getProjectID = (ctx: any): string => ctx.projectID;
const getContractPaths = (ctx: any): ContractPaths => ctx.contractPaths;
const getContracts = (ctx: any): Contracts => ctx.contracts;
const getSmartContractNetworksDefinitions = (ctx: any): SmartContractNetworksDefinitions =>
  ctx.smartContractNetworkDefinitions;
const getNetworkDefinitions = (ctx: any): ReadonlyArray<NetworkDefinition> => ctx.networkDefinitions;
const getWallet = (ctx: any): Wallet => ctx.wallet;
const getNetworkMaybe = (ctx: any): Network | undefined => ctx.networkMaybe;
const getNetwork = (ctx: any): Network => ctx.network;
// tslint:enable no-any

// tslint:disable-next-line export-name
export const build = (pluginManager: PluginManager, options: BuildTaskListOptions): TaskList =>
  new TaskList({
    tasks: [
      {
        title: 'Load project configuration',
        task: async (ctx) => {
          const projectConfig = await loadProjectConfig(options.rootDir);
          let projectID = await loadProjectID(pluginManager, projectConfig, options);
          if (projectID === undefined) {
            projectID = v4();
          } else {
            await getProjectResourceManager(pluginManager)
              .delete(projectID, options)
              .toPromise();
          }
          await getProjectResourceManager(pluginManager)
            .create(projectID, options)
            .toPromise();

          ctx.projectConfig = projectConfig;
          ctx.projectID = projectID;
        },
      },
      {
        title: 'Find contracts',
        task: async (ctx) => {
          ctx.contractPaths = await findContracts(getProjectConfig(ctx));
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
                            .getResource$({
                              name: getLocalNetworkName(options.rootDir, getProjectID(ctx)),
                              options: {},
                            })
                            .pipe(take(1))
                            .toPromise();

                          if (network !== undefined) {
                            await getNetworkResourceManager(pluginManager)
                              .start(getLocalNetworkName(options.rootDir, getProjectID(ctx)), {})
                              .toPromise();
                          }

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
                          getNetworkResourceManager(pluginManager).create(
                            getLocalNetworkName(options.rootDir, getProjectID(ctx)),
                            {},
                          ),
                      },
                      {
                        title: 'Gather network information',
                        task: async (ctx) => {
                          const networkName = getLocalNetworkName(options.rootDir, getProjectID(ctx));
                          const [network, wallet] = await Promise.all([
                            getNetworkResourceManager(pluginManager)
                              .getResource$({ name: networkName, options: {} })
                              .pipe(
                                filter(utils.notNull),
                                take(1),
                              )
                              .toPromise(),
                            getWalletResourceManager(pluginManager)
                              .getResource$({
                                name: walletConstants.makeMasterWallet(networkName),
                                options: { network: networkName },
                              })
                              .pipe(
                                filter(utils.notNull),
                                take(1),
                              )
                              .toPromise(),
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
                          const project = getProjectConfig(ctx);
                          const networksDefinition = getSmartContractNetworksDefinitions(ctx)[contract.name];

                          await generateCode(project, contract, networksDefinition);
                        },
                      }))
                      .concat([
                        {
                          title: 'Generate common code',
                          task: async () => {
                            await generateCommonCode(
                              getProjectConfig(ctx),
                              getProjectID(ctx),
                              getContracts(ctx),
                              constants.LOCAL_NETWORK_NAME,
                              // tslint:disable-next-line no-non-null-assertion
                              getWallet(ctx).wif!,
                              getNetworkDefinitions(ctx),
                              pluginManager.httpServerPort,
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
