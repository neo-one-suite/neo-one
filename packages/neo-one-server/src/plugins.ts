import { Logger } from '@neo-one/logger';
import { Plugin } from '@neo-one/server-plugin';
import { Labels } from '@neo-one/utils';

const DEFAULT_PLUGINS: readonly string[] = [
  '@neo-one/server-plugin-network',
  '@neo-one/server-plugin-wallet',
  '@neo-one/server-plugin-project',
  '@neo-one/server-plugin-neotracker',
];

const getPlugin = ({ logger, pluginName }: { readonly logger: Logger; readonly pluginName: string }): Plugin => {
  try {
    const module = require(pluginName);
    // tslint:disable-next-line variable-name
    const PluginClass = module.default === undefined ? module : module.default;

    return new PluginClass({ logger });
  } catch (error) {
    logger.error(
      { [Labels.PLUGIN_NAME]: pluginName, title: 'neo_load_plugin_error', error },
      `Failed to load plugin: ${pluginName}`,
    );

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
