import { tsUtils } from '@neo-one/ts-utils';
import * as path from 'path';
import ts from 'typescript';
import { pathResolve } from '../../utils';
import { ArrayFilter, ArrayForEach, ArrayLength, ArrayMap, ArrayReduce, ArrayType, ArrayValue } from './array';
import { AssertEqual } from './assertEqual';
import { BooleanValue } from './boolean';
import { BufferConcat, BufferEquals, BufferFrom, BufferType, BufferValue } from './buffer';
import { ConsoleLog } from './console';
import { ObjectKeys, ObjectType, ObjectValue } from './object';
import { StringType, StringValue } from './string';
import { SymbolFor, SymbolIterator, SymbolToPrimitive, SymbolType, SymbolValue } from './symbol';
import { BuiltIn } from './types';

export type BuiltIns = Map<ts.Symbol, BuiltIn>;

export interface BuiltInSymbols {
  readonly array: ts.Symbol;
  readonly arrayClass: ts.Symbol;
  readonly boolean: ts.Symbol;
  readonly booleanClass: ts.Symbol;
  readonly object: ts.Symbol;
  readonly objectClass: ts.Symbol;
  readonly buffer: ts.Symbol;
  readonly bufferClass: ts.Symbol;
  readonly number: ts.Symbol;
  readonly numberClass: ts.Symbol;
  readonly string: ts.Symbol;
  readonly stringClass: ts.Symbol;
  readonly symbol: ts.Symbol;
  readonly symbolClass: ts.Symbol;
  readonly consoleValue: ts.Symbol;
}

export const createBuiltIns = (
  program: ts.Program,
  typeChecker: ts.TypeChecker,
): {
  readonly builtIns: BuiltIns;
  readonly builtInSymbols: BuiltInSymbols;
} => {
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

  const arrayClass = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Array'));
  builtIns.set(arrayClass, new ArrayValue());

  const booleanType = getDeclSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, 'Boolean'));

  const booleanClass = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Boolean'));
  builtIns.set(booleanClass, new BooleanValue());

  const object = getDeclSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, 'Object'));
  builtIns.set(object, new ObjectType());

  const objectClass = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Object'));
  builtIns.set(objectClass, new ObjectValue());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(objectClass, 'keys'), new ObjectKeys());

  const buffer = getDeclSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, 'Buffer'));
  builtIns.set(buffer, new BufferType());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(buffer, 'equals'), new BufferEquals());

  const bufferClass = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Buffer'));
  builtIns.set(bufferClass, new BufferValue());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(bufferClass, 'concat'), new BufferConcat());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(bufferClass, 'from'), new BufferFrom());

  const numberType = getDeclSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, 'Number'));
  builtIns.set(numberType, new StringType());

  const numberClass = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Number'));
  builtIns.set(numberClass, new StringValue());

  const stringType = getDeclSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, 'String'));
  builtIns.set(stringType, new StringType());

  const stringClass = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'String'));
  builtIns.set(stringClass, new StringValue());

  const symbol = getDeclSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, 'Symbol'));
  builtIns.set(symbol, new SymbolType());

  const symbolClass = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Symbol'));
  builtIns.set(symbolClass, new SymbolValue());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(symbolClass, 'for'), new SymbolFor());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(symbolClass, 'iterator'), new SymbolIterator());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(symbolClass, 'toPrimitive'), new SymbolToPrimitive());

  const consoleValue = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'console'));
  builtIns.set(tsUtils.symbol.getMemberOrThrow(consoleValue, 'log'), new ConsoleLog());

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

  return {
    builtIns,
    builtInSymbols: {
      array,
      arrayClass,
      boolean: booleanType,
      booleanClass,
      object,
      objectClass,
      buffer,
      bufferClass,
      number: numberType,
      numberClass,
      string: stringType,
      stringClass,
      symbol,
      symbolClass,
      consoleValue,
    },
  };
};
