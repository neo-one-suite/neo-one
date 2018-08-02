// tslint:disable ban-types no-bitwise
import { tsUtils } from '@neo-one/ts-utils';
import * as path from 'path';
import ts from 'typescript';
import { pathResolve } from './utils';

export interface Globals {
  readonly Array: ts.Symbol;
  readonly Buffer: ts.Symbol;
  readonly BufferFrom: ts.Symbol;
  readonly BufferEquals: ts.Symbol;
  readonly SymbolFor: ts.Symbol;
  readonly consoleLog: ts.Symbol;
  readonly AccountBase: ts.Symbol;
  readonly AssetBase: ts.Symbol;
  readonly AttributeBase: ts.Symbol;
  readonly BlockBase: ts.Symbol;
  readonly ContractBase: ts.Symbol;
  readonly HeaderBase: ts.Symbol;
  readonly InputBase: ts.Symbol;
  readonly OutputBase: ts.Symbol;
  readonly TransactionBase: ts.Symbol;
  readonly ValidatorBase: ts.Symbol;
  readonly StorageContextBase: ts.Symbol;
  readonly StorageContextReadOnlyBase: ts.Symbol;
  readonly StorageIteratorBase: ts.Symbol;
  readonly syscall: ts.Symbol;
}

export const getGlobals = (program: ts.Program, typeChecker: ts.TypeChecker): Globals => {
  const globalsFile = tsUtils.file.getSourceFile(
    program,
    pathResolve(path.dirname(require.resolve('@neo-one/smart-contract')), 'global.d.ts'),
  );
  if (globalsFile === undefined) {
    throw new Error('Could not find Buffer');
  }
  const neoGlobal = tsUtils.file.getSourceFile(
    program,
    pathResolve(path.dirname(require.resolve('@neo-one/smart-contract')), 'sc.d.ts'),
  );
  if (neoGlobal === undefined) {
    throw new Error('Could not find NEO type definition file');
  }

  const buffer = tsUtils.node.getSymbolOrThrow(
    typeChecker,
    tsUtils.statement.getInterfaceOrThrow(globalsFile, 'Buffer'),
  );

  const nodeConsole = tsUtils.node.getSymbolOrThrow(
    typeChecker,
    tsUtils.statement.getInterfaceOrThrow(globalsFile, 'Console'),
  );

  const bufferVar = tsUtils.type_.getSymbolOrThrow(
    tsUtils.type_.getType(typeChecker, tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Buffer')),
  );

  const symbolVar = tsUtils.type_.getSymbolOrThrow(
    tsUtils.type_.getType(typeChecker, tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Symbol')),
  );

  return {
    Array: tsUtils.type_.getSymbolOrThrow(tsUtils.types.getArrayType(typeChecker)),
    Buffer: buffer,
    BufferFrom: tsUtils.symbol.getMemberOrThrow(bufferVar, 'from'),
    BufferEquals: tsUtils.symbol.getMemberOrThrow(buffer, 'equals'),
    consoleLog: tsUtils.symbol.getMemberOrThrow(nodeConsole, 'log'),
    SymbolFor: tsUtils.symbol.getMemberOrThrow(symbolVar, 'for'),
    AccountBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'AccountBase'),
    ),
    AssetBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'AssetBase'),
    ),
    AttributeBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'AttributeBase'),
    ),
    BlockBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'BlockBase'),
    ),
    ContractBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'ContractBase'),
    ),
    HeaderBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'HeaderBase'),
    ),
    InputBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'InputBase'),
    ),
    OutputBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'OutputBase'),
    ),
    TransactionBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'TransactionBase'),
    ),
    ValidatorBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'ValidatorBase'),
    ),
    StorageContextBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'StorageContextBase'),
    ),
    StorageContextReadOnlyBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'StorageContextReadOnlyBase'),
    ),
    StorageIteratorBase: tsUtils.node.getSymbolOrThrow(
      typeChecker,
      tsUtils.statement.getInterfaceOrThrow(neoGlobal, 'StorageIteratorBase'),
    ),
    syscall: tsUtils.node.getSymbolOrThrow(typeChecker, tsUtils.statement.getFunctionOrThrow(neoGlobal, 'syscall')),
  };
};

export interface Libs {
  readonly SmartContract: ts.Symbol;
  readonly MapStorage: ts.Symbol;
  readonly SetStorage: ts.Symbol;
  readonly Fixed: ts.Symbol;
  readonly constant: ts.Symbol;
  readonly verify: ts.Symbol;
  readonly createEventHandler: ts.Symbol;
}

const findLibFile = (program: ts.Program): ts.SourceFile | undefined => {
  const files = program.getSourceFiles();

  return files.find((file) => tsUtils.statement.getClass(file, 'MapStorage') !== undefined);
};

export const getLibs = (program: ts.Program, typeChecker: ts.TypeChecker): Libs => {
  const libFileIn = findLibFile(program);
  if (libFileIn === undefined) {
    throw new Error('Could not find NEO lib file');
  }

  const libFile = libFileIn;

  return {
    get SmartContract(): ts.Symbol {
      return tsUtils.node.getSymbolOrThrow(typeChecker, tsUtils.statement.getClassOrThrow(libFile, 'SmartContract'));
    },
    get MapStorage(): ts.Symbol {
      return tsUtils.node.getSymbolOrThrow(typeChecker, tsUtils.statement.getClassOrThrow(libFile, 'MapStorage'));
    },
    get SetStorage(): ts.Symbol {
      return tsUtils.node.getSymbolOrThrow(typeChecker, tsUtils.statement.getClassOrThrow(libFile, 'SetStorage'));
    },
    get Fixed(): ts.Symbol {
      return tsUtils.node.getSymbolOrThrow(typeChecker, tsUtils.statement.getTypeAliasOrThrow(libFile, 'Fixed'));
    },
    get constant(): ts.Symbol {
      return tsUtils.node.getSymbolOrThrow(typeChecker, tsUtils.statement.getFunctionOrThrow(libFile, 'constant'));
    },
    get verify(): ts.Symbol {
      return tsUtils.node.getSymbolOrThrow(typeChecker, tsUtils.statement.getFunctionOrThrow(libFile, 'verify'));
    },
    get createEventHandler(): ts.Symbol {
      return tsUtils.node.getSymbolOrThrow(
        typeChecker,
        tsUtils.statement.getFunctionOrThrow(libFile, 'createEventHandler'),
      );
    },
  };
};

export interface LibAliases {
  readonly Address: Set<ts.Identifier>;
  readonly Hash256: Set<ts.Identifier>;
  readonly Signature: Set<ts.Identifier>;
  readonly PublicKey: Set<ts.Identifier>;
  readonly Fixed: Set<ts.Identifier>;
}

export interface LibAliasesWithReset extends LibAliases {
  readonly reset: () => void;
}

// tslint:disable readonly-keyword
interface LibAliasesOptional {
  Address?: Set<ts.Identifier>;
  Hash256?: Set<ts.Identifier>;
  Signature?: Set<ts.Identifier>;
  PublicKey?: Set<ts.Identifier>;
  Fixed?: Set<ts.Identifier>;
}
// tslint:enable readonly-keyword

export const getLibAliases = (program: ts.Program, languageService: ts.LanguageService): LibAliasesWithReset => {
  const libFileIn = findLibFile(program);
  if (libFileIn === undefined) {
    throw new Error('Could not find NEO lib file');
  }

  const libFile = libFileIn;

  let aliases: LibAliasesOptional = {};

  return {
    get Address() {
      if (aliases.Address === undefined) {
        // tslint:disable-next-line no-object-mutation
        aliases.Address = new Set(tsUtils.reference.findReferencesAsNodes(
          program,
          languageService,
          tsUtils.statement.getTypeAliasOrThrow(libFile, 'Address'),
        ) as ts.Identifier[]);
      }

      return aliases.Address;
    },
    get Hash256() {
      if (aliases.Hash256 === undefined) {
        // tslint:disable-next-line no-object-mutation
        aliases.Hash256 = new Set(tsUtils.reference.findReferencesAsNodes(
          program,
          languageService,
          tsUtils.statement.getTypeAliasOrThrow(libFile, 'Hash256'),
        ) as ts.Identifier[]);
      }

      return aliases.Hash256;
    },
    get Signature() {
      if (aliases.Signature === undefined) {
        // tslint:disable-next-line no-object-mutation
        aliases.Signature = new Set(tsUtils.reference.findReferencesAsNodes(
          program,
          languageService,
          tsUtils.statement.getTypeAliasOrThrow(libFile, 'Signature'),
        ) as ts.Identifier[]);
      }

      return aliases.Signature;
    },
    get PublicKey() {
      if (aliases.PublicKey === undefined) {
        // tslint:disable-next-line no-object-mutation
        aliases.PublicKey = new Set(tsUtils.reference.findReferencesAsNodes(
          program,
          languageService,
          tsUtils.statement.getTypeAliasOrThrow(libFile, 'PublicKey'),
        ) as ts.Identifier[]);
      }

      return aliases.PublicKey;
    },
    get Fixed() {
      if (aliases.Fixed === undefined) {
        // tslint:disable-next-line no-object-mutation
        aliases.Fixed = new Set(tsUtils.reference.findReferencesAsNodes(
          program,
          languageService,
          tsUtils.statement.getTypeAliasOrThrow(libFile, 'Fixed'),
        ) as ts.Identifier[]);
      }

      return aliases.Fixed;
    },
    reset() {
      aliases = {};
    },
  };
};
