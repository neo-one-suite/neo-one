import { ClassDeclaration } from 'ts-simple-ast';

import * as utils from './utils';
import { getLibs } from './symbols';

export interface Contracts {
  [file: string]: string[];
}

export const scan = async (dir: string): Promise<Contracts> => {
  const ast = await utils.getAst(dir);
  const libs = getLibs(ast);
  const smartContract = libs.SmartContract.getDeclarations()[0] as ClassDeclaration;
  return smartContract.getDerivedClasses().reduce(
    (acc, derived) => {
      if (!derived.isAbstract()) {
        const file = derived.getSourceFile().getFilePath();
        if (acc[file] == null) {
          acc[file] = [];
        }
        acc[file].push(derived.getNameOrThrow());
      }

      return acc;
    },
    {} as Contracts,
  );
};
