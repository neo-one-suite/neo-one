/* @flow */
import {
  type CLIArgs,
  type ResourceType,
  Plugin,
} from '@neo-one/server-plugin';

import ContractResourceType from './ContractResourceType';

import constants from './constants';
import { compileCSharp, compilePython } from './commands';

export default class CompilerPlugin extends Plugin {
  compilerResourceType = new ContractResourceType({
    plugin: this,
  });

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
      capital: 'Compiler',
      capitalPlural: 'Compilers',
      lower: 'compiler',
      lowerPlural: 'compilers',
    };
  }

  get resourceTypes(): Array<ResourceType<*, *>> {
    return [this.compilerResourceType];
  }

  get commands(): Array<(cliArgs: CLIArgs) => void> {
    return [compileCSharp, compilePython];
  }
}
