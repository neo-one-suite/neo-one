/* @flow */
import type { Monitor } from '@neo-one/monitor';
import type { Plugin } from '@neo-one/server-plugin';

import { labels } from '@neo-one/utils';

const DEFAULT_PLUGINS = [
  '@neo-one/server-plugin-network',
  '@neo-one/server-plugin-wallet',
  '@neo-one/server-plugin-compiler',
  '@neo-one/server-plugin-simulation',
];

const getPlugin = ({
  monitor,
  pluginName,
}: {|
  monitor: Monitor,
  pluginName: string,
|}): Plugin => {
  try {
    // $FlowFixMe
    const module = require(pluginName); // eslint-disable-line
    const PluginClass = module.default == null ? module : module.default;
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

const cleanPluginName = ({ pluginName }: {| pluginName: string |}) =>
  pluginName.replace('@', '').replace('/', '-');

export default {
  DEFAULT_PLUGINS,
  getPlugin,
  cleanPluginName,
};
