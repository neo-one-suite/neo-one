/* @flow */
import type { Log } from '@neo-one/utils';
import type { Plugin } from '@neo-one/server-plugin';

const DEFAULT_PLUGINS = [
  '@neo-one/server-plugin-network',
  '@neo-one/server-plugin-wallet',
  '@neo-one/server-plugin-compiler',
  '@neo-one/server-plugin-simulation',
];

const getPlugin = ({
  log,
  pluginName,
}: {|
  log: Log,
  pluginName: string,
|}): Plugin => {
  try {
    // $FlowFixMe
    const module = require(pluginName); // eslint-disable-line
    const PluginClass = module.default == null ? module : module.default;
    return new PluginClass({ log });
  } catch (error) {
    log({ event: 'LOAD_PLUGIN_ERROR', error });
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
