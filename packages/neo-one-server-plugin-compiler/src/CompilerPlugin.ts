import { CLIArgs, Plugin, ResourceType } from '@neo-one/server-plugin';
import { compileCSharp, compilePython } from './commands';
import { constants } from './constants';
import { ContractResourceType } from './ContractResourceType';

export class CompilerPlugin extends Plugin {
  public readonly compilerResourceType = new ContractResourceType({
    plugin: this,
  });

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
      capital: 'Compiler',
      capitalPlural: 'Compilers',
      lower: 'compiler',
      lowerPlural: 'compilers',
    };
  }

  public get resourceTypes(): ReadonlyArray<ResourceType> {
    return [this.compilerResourceType];
  }

  public get commands(): ReadonlyArray<(cliArgs: CLIArgs) => void> {
    return [compileCSharp, compilePython];
  }
}
