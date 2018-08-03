import { tsUtils } from '@neo-one/ts-utils';
import * as path from 'path';
import ts from 'typescript';
import { pathResolve } from '../../utils';
import { ArrayFilter, ArrayForEach, ArrayLength, ArrayMap, ArrayReduce, ArrayType, ArrayValue } from './array';
import { AssertEqual } from './assertEqual';
import { BufferConcat, BufferEquals, BufferFrom, BufferType, BufferValue } from './buffer';
import { ConsoleLog } from './console';
import { ObjectKeys, ObjectType, ObjectValue } from './object';
import { SymbolFor, SymbolIterator, SymbolType, SymbolValue } from './symbol';
import { BuiltIn } from './types';

export type BuiltIns = Map<ts.Symbol, BuiltIn>;

export const createBuiltIns = (program: ts.Program, typeChecker: ts.TypeChecker): BuiltIns => {
  const globalsFile = tsUtils.file.getSourceFileOrThrow(
    program,
    pathResolve(path.dirname(require.resolve('@neo-one/smart-contract')), 'global.d.ts'),
  );

  const builtIns = new Map<ts.Symbol, BuiltIn>();

  const getDeclSymbol = (decl: ts.Declaration): ts.Symbol => {
    const type = tsUtils.type_.getType(typeChecker, decl);
    const symb = tsUtils.type_.getSymbol(type);
    if (symb === undefined) {
      return tsUtils.node.getSymbolOrThrow(typeChecker, decl);
    }

    return symb;
  };

  const array = tsUtils.type_.getSymbolOrThrow(tsUtils.types.getArrayType(typeChecker));
  builtIns.set(array, new ArrayType());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(array, 'filter'), new ArrayFilter());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(array, 'forEach'), new ArrayForEach());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(array, 'length'), new ArrayLength());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(array, 'map'), new ArrayMap());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(array, 'reduce'), new ArrayReduce());

  const arrayVar = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Array'));
  builtIns.set(arrayVar, new ArrayValue());

  const object = getDeclSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, 'Object'));
  builtIns.set(object, new ObjectType());

  const objectVar = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Object'));
  builtIns.set(objectVar, new ObjectValue());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(objectVar, 'keys'), new ObjectKeys());

  const buffer = getDeclSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, 'Buffer'));
  builtIns.set(buffer, new BufferType());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(buffer, 'equals'), new BufferEquals());

  const bufferVar = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Buffer'));
  builtIns.set(bufferVar, new BufferValue());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(bufferVar, 'concat'), new BufferConcat());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(bufferVar, 'from'), new BufferFrom());

  const symbol = getDeclSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, 'Symbol'));
  builtIns.set(symbol, new SymbolType());

  const symbolVar = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Symbol'));
  builtIns.set(symbolVar, new SymbolValue());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(symbolVar, 'for'), new SymbolFor());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(symbolVar, 'iterator'), new SymbolIterator());

  const consoleVar = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'console'));
  builtIns.set(tsUtils.symbol.getMemberOrThrow(consoleVar, 'log'), new ConsoleLog());

  const testHarnessFile = tsUtils.file.getSourceFile(
    program,
    pathResolve(path.dirname(require.resolve('@neo-one/smart-contract')), 'harness.d.ts'),
  );
  if (testHarnessFile !== undefined) {
    builtIns.set(
      getDeclSymbol(tsUtils.statement.getFunctionOrThrow(testHarnessFile, 'assertEqual')),
      new AssertEqual(),
    );
  }

  return builtIns;
};
