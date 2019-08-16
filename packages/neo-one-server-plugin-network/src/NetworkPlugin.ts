import { CLIArgs, InteractiveCommand, Plugin, ResourceType } from '@neo-one/server-plugin';
import { activateNetwork } from './activateNetwork';
import { constants } from './constants';
import { deactivateNetwork } from './deactivateNetwork';
import { NetworkResourceType } from './NetworkResourceType';
import { startNode } from './startNode';

export class NetworkPlugin extends Plugin {
  public readonly networkResourceType = new NetworkResourceType({ plugin: this });

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
      capital: 'Network',
      capitalPlural: 'Networks',
      lower: 'network',
      lowerPlural: 'networks',
    };
  }

  public get resourceTypes(): readonly ResourceType[] {
    return [this.networkResourceType];
  }

  public get commands(): ReadonlyArray<(cliArgs: CLIArgs) => void> {
    return [startNode];
  }

  public get interactive(): readonly InteractiveCommand[] {
    return [activateNetwork(this), deactivateNetwork(this)];
  }
}
