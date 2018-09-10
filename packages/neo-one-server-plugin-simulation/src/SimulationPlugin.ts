import { InteractiveCommand, Plugin } from '@neo-one/server-plugin';
import { constants as projectConstants } from '@neo-one/server-plugin-project';
import { constants } from './constants';
import { createCommand } from './createCommand';
import { goCommand } from './goCommand';

export class SimulationPlugin extends Plugin {
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
    return [projectConstants.PLUGIN];
  }

  public get interactive(): ReadonlyArray<InteractiveCommand> {
    return [createCommand, goCommand];
  }
}
