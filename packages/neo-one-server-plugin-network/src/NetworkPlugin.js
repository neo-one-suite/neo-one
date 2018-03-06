/* @flow */
import {
  type CLIArgs,
  type InteractiveCommand,
  type ResourceType,
  Plugin,
} from '@neo-one/server-plugin';

import NetworkResourceType from './NetworkResourceType';

import activateNetwork from './activateNetwork';
import backupNode from './backupNode';
import constants from './constants';
import deactivateNetwork from './deactivateNetwork';
import restoreNode from './restoreNode';
import startNode from './startNode';

export default class NetworkPlugin extends Plugin {
  networkResourceType = new NetworkResourceType({ plugin: this });

  get name(): string {
    return constants.PLUGIN;
  }

  get names(): {|
    capital: string,
    capitalPlural: string,
    lower: string,
    lowerPlural: string,
  |} {
    return {
      capital: 'Network',
      capitalPlural: 'Networks',
      lower: 'network',
      lowerPlural: 'networks',
    };
  }

  get resourceTypes(): Array<ResourceType<*, *>> {
    return [this.networkResourceType];
  }

  get commands(): Array<(cliArgs: CLIArgs) => void> {
    return [backupNode, restoreNode, startNode];
  }

  get interactive(): Array<InteractiveCommand> {
    return [activateNetwork(this), deactivateNetwork(this)];
  }
}
