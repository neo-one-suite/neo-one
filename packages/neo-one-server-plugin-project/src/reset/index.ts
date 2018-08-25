import { DeveloperClient, NEOONEDataProvider } from '@neo-one/client';
import { PluginManager, TaskList } from '@neo-one/server-plugin';
import { getNEOTrackerResourceManager } from '@neo-one/server-plugin-neotracker';
import { getNetworkResourceManager } from '@neo-one/server-plugin-network';
import { build } from '../build';
import { BuildTaskListOptions, ResetTaskListOptions } from '../types';
import {
  getLocalNEOTrackerName,
  getLocalNetworkName,
  getProject as loadProject,
  loadProjectConfig,
  loadProjectID,
} from '../utils';

// tslint:disable no-any
const getBuildOptions = (ctx: any): BuildTaskListOptions => ctx.buildOptions;
const getProjectIDMaybe = (ctx: any): string | undefined => ctx.projectID;
const getProjectID = (ctx: any): string => ctx.projectID;
// tslint:enable no-any

// tslint:disable-next-line export-name
export const reset = (pluginManager: PluginManager, options: ResetTaskListOptions): TaskList =>
  new TaskList({
    tasks: [
      {
        title: 'Load project configuration',
        task: async (ctx) => {
          const { rootDir: rootDirIn, projectID: projectIDIn } = options;
          if (projectIDIn !== undefined) {
            const project = await loadProject(pluginManager, projectIDIn);
            const buildOptions: BuildTaskListOptions = {
              command: 'build',
              rootDir: project.rootDir,
            };
            ctx.buildOptions = buildOptions;
            ctx.projectID = projectIDIn;
          } else if (rootDirIn !== undefined) {
            const buildOptions: BuildTaskListOptions = {
              command: 'build',
              rootDir: rootDirIn,
            };
            ctx.buildOptions = buildOptions;
            const projectConfig = await loadProjectConfig(rootDirIn);
            ctx.projectID = await loadProjectID(pluginManager, projectConfig, options);
          } else {
            throw new Error('One of projectID or rootDir must be defined');
          }
        },
      },
      {
        title: 'Reset development network',
        skip: (ctx) => {
          if (getProjectIDMaybe(ctx) === undefined) {
            return 'Project has not been created.';
          }

          return false;
        },
        task: async (ctx) => {
          const networkName = getLocalNetworkName(getBuildOptions(ctx).rootDir, getProjectID(ctx));
          const [network, neotracker] = await Promise.all([
            getNetworkResourceManager(pluginManager).getResource({ name: networkName, options: {} }),
            getNEOTrackerResourceManager(pluginManager).getResource({
              name: getLocalNEOTrackerName(networkName),
              options: {},
            }),
          ]);

          if (network.state !== 'started') {
            await getNetworkResourceManager(pluginManager)
              .start(getLocalNetworkName(getBuildOptions(ctx).rootDir, getProjectID(ctx)), {})
              .toPromise();
          }

          const developerClient = new DeveloperClient(
            new NEOONEDataProvider({ network: 'local', rpcURL: network.nodes[0].rpcAddress }),
          );
          await developerClient.reset();
          await developerClient.updateSettings({ secondsPerBlock: 15 });
          await network.live();
          await network.ready();
          await neotracker.reset();
        },
      },
      {
        title: 'Build',
        task: (ctx) => build(pluginManager, getBuildOptions(ctx), { forceTransfer: true }),
      },
    ],
  });
