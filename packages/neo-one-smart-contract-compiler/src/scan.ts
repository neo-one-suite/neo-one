import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import ts from 'typescript';
import { Context } from './Context';
import { createContextForDir } from './createContext';
import { CircularLinkedDependencyError, MultipleContractsInFileError } from './errors';
import { CompilerHost } from './types';

export interface ContractDependency {
  readonly filePath: string;
  readonly name: string;
}
export interface Contract {
  readonly filePath: string;
  readonly name: string;
  readonly dependencies: ReadonlyArray<ContractDependency>;
}
export type Contracts = ReadonlyArray<Contract>;

interface FilePathToContract {
  readonly [filePath: string]: Contract;
}
interface FilePathToDependencies {
  readonly [filePath: string]: ReadonlyArray<ContractDependency>;
}

export const scanContext = (context: Context): Contracts => {
  const smartContract = tsUtils.symbol.getDeclarations(context.builtins.getValueSymbol('SmartContract'))[0];
  if (!ts.isClassDeclaration(smartContract)) {
    throw new Error('Something went wrong!');
  }

  const { contracts, dependencies } = tsUtils.class_
    .getExtendors(context.program, context.languageService, smartContract)
    .reduce<{ contracts: FilePathToContract; dependencies: FilePathToDependencies }>(
      (acc, derived) => {
        if (
          !tsUtils.modifier.isAbstract(derived) &&
          !tsUtils.file.isDeclarationFile(tsUtils.node.getSourceFile(derived))
        ) {
          const filePath = tsUtils.file.getFilePath(tsUtils.node.getSourceFile(derived));
          const name = tsUtils.node.getNameOrThrow(derived);
          const existing = acc.contracts[filePath] as Contract | undefined;
          if (existing !== undefined) {
            throw new MultipleContractsInFileError(filePath);
          }

          const references = [
            ...new Set(
              tsUtils.reference
                .findReferencesAsNodes(context.program, context.languageService, derived)
                .map((reference) => tsUtils.file.getFilePath(tsUtils.node.getSourceFile(reference))),
            ),
          ];

          const dependency = { filePath, name };
          const dependenciesOut = references.reduce((innerAcc, reference) => {
            let filePathDependencies = innerAcc[reference] as ReadonlyArray<ContractDependency> | undefined;
            if (filePathDependencies === undefined) {
              filePathDependencies = [];
            }

            return {
              ...innerAcc,
              [reference]: [...filePathDependencies, dependency],
            };
          }, acc.dependencies);

          return {
            contracts: {
              ...acc.contracts,
              [filePath]: {
                filePath,
                name,
                dependencies: [],
              },
            },
            dependencies: dependenciesOut,
          };
        }

        return acc;
      },
      { contracts: {}, dependencies: {} },
    );

  const unsortedContracts = Object.values(contracts).map((contract) => {
    const filePathDependencies = dependencies[contract.filePath] as ReadonlyArray<ContractDependency> | undefined;

    return {
      ...contract,
      dependencies: filePathDependencies === undefined ? [] : filePathDependencies,
    };
  });

  return topographicalSort(unsortedContracts);
};

const topographicalSort = (contracts: Contracts): Contracts => {
  const contractToDependencies = contracts.reduce<{ [filePath: string]: Set<string> }>(
    (acc, contract) => ({
      ...acc,
      [contract.filePath]: new Set(contract.dependencies.map((dep) => dep.filePath)),
    }),
    {},
  );
  const mutableOut: Contract[] = [];
  const satisfied = contracts.filter((contract) => contract.dependencies.length === 0);
  let remaining = contracts.filter((contract) => contract.dependencies.length !== 0);
  // tslint:disable-next-line no-loop-statement
  while (satisfied.length > 0) {
    // tslint:disable-next-line no-array-mutation
    const node = satisfied.shift();
    if (node === undefined) {
      /* istanbul ignore next */
      break;
    }

    mutableOut.push(node);
    remaining = remaining
      .map((contract) => {
        const deps = contractToDependencies[contract.filePath];
        deps.delete(node.filePath);
        if (deps.size === 0) {
          // tslint:disable-next-line no-array-mutation
          satisfied.push(contract);

          return undefined;
        }

        return contract;
      })
      .filter(utils.notNull);
  }

  if (mutableOut.length !== contracts.length) {
    throw new CircularLinkedDependencyError(contracts.map((contract) => contract.name));
  }

  return mutableOut;
};

export const scan = async (dir: string, host: CompilerHost): Promise<Contracts> => {
  const context = await createContextForDir(dir, host);

  return scanContext(context);
};
