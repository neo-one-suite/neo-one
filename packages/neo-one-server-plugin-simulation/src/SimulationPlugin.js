/* @flow */
import {
  type InteractiveCommand,
  type ResourceType,
  Plugin,
} from '@neo-one/server-plugin';

import { constants as compilerConstants } from '@neo-one/server-plugin-compiler';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { constants as walletConstants } from '@neo-one/server-plugin-wallet';

import SimulationResourceType from './SimulationResourceType';

import constants from './constants';
import goCommand from './goCommand';

export default class SimulationPlugin extends Plugin {
  simulationResourceType = new SimulationResourceType({ plugin: this });

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
      capital: 'Simulation',
      capitalPlural: 'Simulations',
      lower: 'simulation',
      lowerPlural: 'simulations',
    };
  }

  get dependencies(): Array<string> {
    return [
      networkConstants.PLUGIN,
      compilerConstants.PLUGIN,
      walletConstants.PLUGIN,
    ];
  }

  get resourceTypes(): Array<ResourceType<*, *>> {
    return [this.simulationResourceType];
  }

  get interactive(): Array<InteractiveCommand> {
    return [goCommand];
  }
}
