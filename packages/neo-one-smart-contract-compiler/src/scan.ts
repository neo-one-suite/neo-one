import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { createContextForDir } from './createContext';

export type Contracts = { [K in string]?: ReadonlyArray<string> };

export const scan = async (dir: string): Promise<Contracts> => {
  const context = await createContextForDir(dir);
  const smartContract = tsUtils.symbol.getDeclarations(context.builtins.getInterfaceSymbol('SmartContract'))[0];
  if (!ts.isInterfaceDeclaration(smartContract)) {
    throw new Error('Something went wrong!');
  }

  return tsUtils.class_
    .getImplementors(context.program, context.languageService, smartContract)
    .reduce<Contracts>((acc, derived) => {
      if (!tsUtils.modifier.isAbstract(derived)) {
        const file = tsUtils.file.getFilePath(tsUtils.node.getSourceFile(derived));
        const name = tsUtils.node.getNameOrThrow(derived);
        const files = acc[file];

        return {
          ...acc,
          [file]: files === undefined ? [name] : files.concat([name]),
        };
      }

      return acc;
    }, {});
};
