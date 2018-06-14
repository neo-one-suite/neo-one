import { TypeGuards } from 'ts-simple-ast';

import { getLibs } from './symbols';
import * as utils from './utils';

export type Contracts = { [K in string]?: ReadonlyArray<string> };

export const scan = async (dir: string): Promise<Contracts> => {
  const ast = await utils.getAst(dir);
  const libs = getLibs(ast);
  const smartContract = libs.SmartContract.getDeclarations()[0];
  if (!TypeGuards.isClassDeclaration(smartContract)) {
    throw new Error('Something went wrong!');
  }

  return smartContract.getDerivedClasses().reduce<Contracts>((acc, derived) => {
    if (!derived.isAbstract()) {
      const file = derived.getSourceFile().getFilePath();
      const name = derived.getNameOrThrow();
      const files = acc[file];

      return {
        ...acc,
        [file]: files === undefined ? [name] : files.concat([name]),
      };
    }

    return acc;
  }, {});
};
