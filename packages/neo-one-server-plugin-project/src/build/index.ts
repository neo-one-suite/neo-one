import { SmartContractNetworksDefinition } from '@neo-one/client';
import { PluginManager, TaskList } from '@neo-one/server-plugin';
import { constants as networkConstants, Network } from '@neo-one/server-plugin-network';
import { utils } from '@neo-one/utils';
import * as path from 'path';
import { filter, take } from 'rxjs/operators';
import { DiagnosticCategory } from 'typescript';
import { constants } from '../constants';
import { loadProject } from '../loadProject';
import { BuildTaskListOptions, ProjectConfig } from '../types';
import { compileContract, ContractResult } from './compileContract';
import { deployContract } from './deployContract';
import { Contracts as ContractPaths, findContracts } from './findContracts';
import { generateCode } from './generateCode';

// tslint:disable-next-line readonly-array
type Contracts = ContractResult[];
interface NetworksDefinitions {
  // tslint:disable-next-line readonly-keyword
  [contractName: string]: SmartContractNetworksDefinition;
}

// tslint:disable no-any
const getProject = (ctx: any): ProjectConfig => ctx.project;
const getProjectName = (ctx: any): string => ctx.projectName;
const getContractPaths = (ctx: any): ContractPaths => ctx.contractPaths;
const getContracts = (ctx: any): Contracts => ctx.contracts;
const getNetworksDefinitions = (ctx: any): NetworksDefinitions => ctx.networksDefinitions;
const getNetworkMaybe = (ctx: any): Network | undefined => ctx.networkMaybe;
// tslint:enable no-any

const getNetworkName = (projectName: string) => `${projectName}-local`;
const getNetworkResourceManager = (pluginManager: PluginManager) =>
  pluginManager.getResourcesManager({
    plugin: networkConstants.PLUGIN,
    resourceType: networkConstants.NETWORK_RESOURCE_TYPE,
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
        title: 'Compile contracts',
        task: (ctx) => {
          ctx.contracts = [];

          return new TaskList({
            concurrent: true,
            tasks: getContractPaths(ctx).map((contract) => ({
              title: `Compile ${contract.contractName}`,
              task: async () => {
                const result = await compileContract(contract);

                // tslint:disable-next-line no-array-mutation
                getContracts(ctx).push(result);
              },
            })),
          });
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
                    ],
                  }),
              },
              {
                title: 'Deploy',
                task: (ctx) => {
                  ctx.networksDefinitions = {};

                  return new TaskList({
                    concurrent: true,
                    tasks: getContracts(ctx).map((contract) => ({
                      title: `Deploy ${contract.contractName}`,
                      skip: () => {
                        if (
                          contract.diagnostics.some((diagnostic) => diagnostic.category === DiagnosticCategory.Error)
                        ) {
                          return 'Compilation error.';
                        }

                        return false;
                      },
                      task: async () => {
                        const network = (await getNetworkResourceManager(pluginManager)
                          .getResource$({ name: getNetworkName(getProjectName(ctx)), options: {} })
                          .pipe(
                            filter(utils.notNull),
                            take(1),
                          )
                          .toPromise()) as Network;
                        const [hash, prodNetworksDefinition] = await Promise.all([
                          deployContract(network, contract),
                          Promise.resolve({}),
                        ]);

                        // tslint:disable-next-line no-object-mutation
                        getNetworksDefinitions(ctx)[contract.contractName] = {
                          ...prodNetworksDefinition,
                          [constants.LOCAL_NETWORK_NAME]: { hash },
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
                      .filter(({ contractName }) => {
                        const networksDefinition = getNetworksDefinitions(ctx)[contractName] as
                          | SmartContractNetworksDefinition
                          | undefined;

                        return networksDefinition !== undefined;
                      })
                      .map((contract) => ({
                        title: `Generate ${contract.contractName} code`,
                        task: async () => {
                          const project = getProject(ctx);
                          const networksDefinition = getNetworksDefinitions(ctx)[contract.contractName];

                          await generateCode(project, contract, networksDefinition);
                        },
                      })),
                  }),
              },
            ],
          }),
      },
    ],
  });
