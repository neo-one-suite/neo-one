import { InteractiveCommand, Plugin, ResourceType } from '@neo-one/server-plugin';
import { constants as compilerConstants } from '@neo-one/server-plugin-compiler';
import { constants as networkConstants } from '@neo-one/server-plugin-network';
import { constants as walletConstants } from '@neo-one/server-plugin-wallet';
import { constants } from './constants';
import { goCommand } from './goCommand';
import { SimulationResourceType } from './SimulationResourceType';

export class SimulationPlugin extends Plugin {
  public readonly simulationResourceType = new SimulationResourceType({ plugin: this });

  public get name(): string {
    return constants.PLUGIN;
  }

  public get names(): {
    readonly capital: string;
    readonly capitalPlural: string;
    readonly lower: string;
    readonly lowerPlural: string;
  } {
    return {
      capital: 'Simulation',
      capitalPlural: 'Simulations',
      lower: 'simulation',
      lowerPlural: 'simulations',
    };
  }

  public get dependencies(): ReadonlyArray<string> {
    return [networkConstants.PLUGIN, compilerConstants.PLUGIN, walletConstants.PLUGIN];
  }

  public get resourceTypes(): ReadonlyArray<ResourceType> {
    return [this.simulationResourceType];
  }

  public get interactive(): ReadonlyArray<InteractiveCommand> {
    return [goCommand];
  }
}
