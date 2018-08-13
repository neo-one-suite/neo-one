import { Monitor } from '@neo-one/monitor';
import { Plugin } from '@neo-one/server-plugin';
import { labels } from '@neo-one/utils';

const DEFAULT_PLUGINS: ReadonlyArray<string> = [
  '@neo-one/server-plugin-network',
  '@neo-one/server-plugin-wallet',
  '@neo-one/server-plugin-compiler',
  '@neo-one/server-plugin-simulation',
  '@neo-one/server-plugin-project',
];

const getPlugin = ({ monitor, pluginName }: { readonly monitor: Monitor; readonly pluginName: string }): Plugin => {
  try {
    const module = require(pluginName);
    // tslint:disable-next-line variable-name
    const PluginClass = module.default === undefined ? module : module.default;

    return new PluginClass({ monitor });
  } catch (error) {
    monitor.withLabels({ [labels.PLUGIN_NAME]: pluginName }).logError({
      name: 'neo_load_plugin_error',
      message: `Failed to load plugin: ${pluginName}`,
      error,
    });

    throw error;
  }
};

const cleanPluginName = ({ pluginName }: { readonly pluginName: string }) =>
  pluginName.replace('@', '').replace('/', '-');

export const plugins = {
  DEFAULT_PLUGINS,
  getPlugin,
  cleanPluginName,
};
