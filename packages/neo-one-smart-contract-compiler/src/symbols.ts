// tslint:disable ban-types no-bitwise
import Project, { Identifier, SourceFile, Symbol, ts } from 'ts-simple-ast';

import path from 'path';

export interface Globals {
  readonly Array: Symbol;
  readonly Buffer: Symbol;
  readonly process: Symbol;
  readonly AccountBase: Symbol;
  readonly AssetBase: Symbol;
  readonly AttributeBase: Symbol;
  readonly BlockBase: Symbol;
  readonly ContractBase: Symbol;
  readonly HeaderBase: Symbol;
  readonly InputBase: Symbol;
  readonly OutputBase: Symbol;
  readonly TransactionBase: Symbol;
  readonly ValidatorBase: Symbol;
  readonly StorageContextBase: Symbol;
  readonly StorageIteratorBase: Symbol;
  readonly syscall: Symbol;
}

const findInterfaceFile = (ast: Project, name: string): SourceFile | undefined => {
  const files = ast.getSourceFiles();

  return files.find((file) => {
    if (!file.isDeclarationFile()) {
      return false;
    }

    let bufferInterface = file.getInterface(name);
    const globalNamespace = file.getNamespace('global');
    let isGlobalAugmentation = false;
    if (bufferInterface === undefined && globalNamespace !== undefined) {
      bufferInterface = globalNamespace.getInterface(name);
      isGlobalAugmentation = true;
    }

    if (bufferInterface === undefined) {
      return false;
    }

    return isGlobalAugmentation || (bufferInterface.compilerNode.flags & ts.NodeFlags.GlobalAugmentation) !== 0;
  });
};

export const getGlobals = (ast: Project): Globals => {
  let bufferFile = findInterfaceFile(ast, 'Buffer');
  if (bufferFile === undefined) {
    bufferFile = ast.addExistingSourceFileIfExists(require.resolve('@types/node/index.d.ts'));
  }
  if (bufferFile === undefined) {
    throw new Error('Could not find Buffer');
  }
  const buffer = bufferFile.getInterfaceOrThrow('Buffer');

  // tslint:disable-next-line no-any
  const typeChecker = ast.getTypeChecker().compilerObject as any;
  // @ts-ignore
  const array = new Symbol(
    // @ts-ignore
    ast.global,
    typeChecker.createArrayType(typeChecker.getAnyType()).symbol as ts.Symbol,
  ).getDeclaredType();

  let neoFile = findInterfaceFile(ast, 'AccountBase');
  if (neoFile === undefined) {
    ast.addExistingSourceFiles(path.join(path.dirname(require.resolve('@neo-one/smart-contract')), '**', '*.ts'));
  }

  neoFile = findInterfaceFile(ast, 'AccountBase');
  if (neoFile === undefined) {
    throw new Error('Could not find NEO type definition file');
  }

  const neoGlobal = neoFile.getNamespaceOrThrow('global');

  return {
    Array: array.getSymbolOrThrow(),
    Buffer: buffer.getSymbolOrThrow(),
    process: bufferFile.getVariableDeclarationOrThrow('process').getSymbolOrThrow(),
    AccountBase: neoGlobal.getInterfaceOrThrow('AccountBase').getSymbolOrThrow(),
    AssetBase: neoGlobal.getInterfaceOrThrow('AssetBase').getSymbolOrThrow(),
    AttributeBase: neoGlobal.getInterfaceOrThrow('AttributeBase').getSymbolOrThrow(),
    BlockBase: neoGlobal.getInterfaceOrThrow('BlockBase').getSymbolOrThrow(),
    ContractBase: neoGlobal.getInterfaceOrThrow('ContractBase').getSymbolOrThrow(),
    HeaderBase: neoGlobal.getInterfaceOrThrow('HeaderBase').getSymbolOrThrow(),
    InputBase: neoGlobal.getInterfaceOrThrow('InputBase').getSymbolOrThrow(),
    OutputBase: neoGlobal.getInterfaceOrThrow('OutputBase').getSymbolOrThrow(),
    TransactionBase: neoGlobal.getInterfaceOrThrow('TransactionBase').getSymbolOrThrow(),
    ValidatorBase: neoGlobal.getInterfaceOrThrow('ValidatorBase').getSymbolOrThrow(),
    StorageContextBase: neoGlobal.getInterfaceOrThrow('StorageContextBase').getSymbolOrThrow(),
    StorageIteratorBase: neoGlobal.getInterfaceOrThrow('StorageIteratorBase').getSymbolOrThrow(),
    syscall: neoGlobal.getFunctionOrThrow('syscall').getSymbolOrThrow(),
  };
};

export interface Libs {
  readonly SmartContract: Symbol;
  readonly MapStorage: Symbol;
  readonly SetStorage: Symbol;
  readonly Fixed: Symbol;
  readonly constant: Symbol;
  readonly verify: Symbol;
  readonly createEventHandler: Symbol;
}

const findLibFile = (ast: Project): SourceFile | undefined => {
  const files = ast.getSourceFiles();

  return files.find((file) => file.getClass('MapStorage') !== undefined);
};

export const getLibs = (ast: Project): Libs => {
  let libFileIn = findLibFile(ast);
  if (libFileIn === undefined) {
    ast.addExistingSourceFiles(path.join(path.dirname(require.resolve('@neo-one/smart-contract')), '**', '*.ts'));
  }

  libFileIn = findLibFile(ast);
  if (libFileIn === undefined) {
    throw new Error('Could not find NEO lib file');
  }

  const libFile = libFileIn;

  return {
    get SmartContract(): Symbol {
      return libFile.getClassOrThrow('SmartContract').getSymbolOrThrow();
    },
    get MapStorage(): Symbol {
      return libFile.getClassOrThrow('MapStorage').getSymbolOrThrow();
    },
    get SetStorage(): Symbol {
      return libFile.getClassOrThrow('SetStorage').getSymbolOrThrow();
    },
    get Fixed(): Symbol {
      return libFile.getTypeAliasOrThrow('Fixed').getSymbolOrThrow();
    },
    get constant(): Symbol {
      return libFile.getFunctionOrThrow('constant').getSymbolOrThrow();
    },
    get verify(): Symbol {
      return libFile.getFunctionOrThrow('verify').getSymbolOrThrow();
    },
    get createEventHandler(): Symbol {
      return libFile.getFunctionOrThrow('createEventHandler').getSymbolOrThrow();
    },
  };
};

export interface LibAliases {
  readonly Address: Set<Identifier>;
  readonly Hash256: Set<Identifier>;
  readonly Signature: Set<Identifier>;
  readonly PublicKey: Set<Identifier>;
  readonly Fixed: Set<Identifier>;
}

export interface LibAliasesWithReset extends LibAliases {
  readonly reset: () => void;
}

// tslint:disable readonly-keyword
interface LibAliasesOptional {
  Address?: Set<Identifier>;
  Hash256?: Set<Identifier>;
  Signature?: Set<Identifier>;
  PublicKey?: Set<Identifier>;
  Fixed?: Set<Identifier>;
}
// tslint:enable readonly-keyword

export const getLibAliases = (ast: Project): LibAliasesWithReset => {
  let libFileIn = findLibFile(ast);
  if (libFileIn === undefined) {
    ast.addExistingSourceFiles(path.join(path.dirname(require.resolve('@neo-one/smart-contract')), '**', '*.ts'));
  }

  libFileIn = findLibFile(ast);
  if (libFileIn === undefined) {
    throw new Error('Could not find NEO lib file');
  }

  const libFile = libFileIn;

  let aliases: LibAliasesOptional = {};

  return {
    get Address() {
      if (aliases.Address === undefined) {
        // tslint:disable-next-line no-object-mutation
        aliases.Address = new Set(libFile.getTypeAliasOrThrow('Address').findReferencesAsNodes() as Identifier[]);
      }

      return aliases.Address;
    },
    get Hash256() {
      if (aliases.Hash256 === undefined) {
        // tslint:disable-next-line no-object-mutation
        aliases.Hash256 = new Set(libFile.getTypeAliasOrThrow('Hash256').findReferencesAsNodes() as Identifier[]);
      }

      return aliases.Hash256;
    },
    get Signature() {
      if (aliases.Signature === undefined) {
        // tslint:disable-next-line no-object-mutation
        aliases.Signature = new Set(libFile.getTypeAliasOrThrow('Signature').findReferencesAsNodes() as Identifier[]);
      }

      return aliases.Signature;
    },
    get PublicKey() {
      if (aliases.PublicKey === undefined) {
        // tslint:disable-next-line no-object-mutation
        aliases.PublicKey = new Set(libFile.getTypeAliasOrThrow('PublicKey').findReferencesAsNodes() as Identifier[]);
      }

      return aliases.PublicKey;
    },
    get Fixed() {
      if (aliases.Fixed === undefined) {
        // tslint:disable-next-line no-object-mutation
        aliases.Fixed = new Set(libFile.getTypeAliasOrThrow('Fixed').findReferencesAsNodes() as Identifier[]);
      }

      return aliases.Fixed;
    },
    reset() {
      aliases = {};
    },
  };
};
