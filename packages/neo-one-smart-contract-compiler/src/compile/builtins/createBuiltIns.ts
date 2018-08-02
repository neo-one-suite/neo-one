import { tsUtils } from '@neo-one/ts-utils';
import * as path from 'path';
import ts from 'typescript';
import { pathResolve } from '../../utils';
import { ArrayFilter, ArrayMap, ArrayType, ArrayValue } from './array';
import { AssertEqual } from './assertEqual';
import { ObjectKeys, ObjectType, ObjectValue } from './object';
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
    const symbol = tsUtils.type_.getSymbol(type);
    if (symbol === undefined) {
      return tsUtils.node.getSymbolOrThrow(typeChecker, decl);
    }

    return symbol;
  };

  const array = tsUtils.type_.getSymbolOrThrow(tsUtils.types.getArrayType(typeChecker));
  builtIns.set(array, new ArrayType());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(array, 'filter'), new ArrayFilter());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(array, 'map'), new ArrayMap());

  const arrayVar = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Array'));
  builtIns.set(arrayVar, new ArrayValue());

  const object = getDeclSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, 'Object'));
  builtIns.set(object, new ObjectType());

  const objectVar = getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, 'Object'));
  builtIns.set(objectVar, new ObjectValue());
  builtIns.set(tsUtils.symbol.getMemberOrThrow(objectVar, 'keys'), new ObjectKeys());

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
