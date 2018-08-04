import { tsUtils } from '@neo-one/ts-utils';
import * as path from 'path';
import ts from 'typescript';
import { pathResolve } from '../../utils';
import { ArgumentsInstance } from './arguments';
import { ArrayFilter, ArrayForEach, ArrayInstance, ArrayLength, ArrayMap, ArrayReduce, ArrayType } from './array';
import { AssertEqual } from './assertEqual';
import { BooleanInstance, BooleanType } from './boolean';
import { BufferConcat, BufferEquals, BufferFrom, BufferInstance, BufferType } from './buffer';
import { ConsoleLog, ConsoleType, ConsoleValue } from './console';
import { ErrorInstance, ErrorType } from './error';
import { FunctionInstance, FunctionType } from './function';
import { IterableInstance } from './iterable';
import { IterableIteratorInstance } from './iterableIterator';
import { IteratorInstance } from './iterator';
import { IteratorResultInstance } from './iteratorResult';
import { MapInstance, MapType } from './map';
import { NumberInstance, NumberType } from './number';
import { ObjectInstance, ObjectKeys, ObjectType } from './object';
import { PropertyDescriptorInstance } from './propertyDescriptor';
import { RegExpInstance, RegExpType } from './regexp';
import { StringInstance, StringType } from './string';
import { SymbolFor, SymbolInstance, SymbolIterator, SymbolToPrimitive, SymbolType } from './symbol';
import { TemplateStringsArrayInstance } from './templateStringsArray';
import { TypedPropertyDescriptorInstance } from './typedPropertyDescriptor';
import { BuiltIn } from './types';

export type BuiltIns = Map<ts.Symbol, BuiltIn>;

export interface BuiltInSymbols {
  readonly argumentsInstance: ts.Symbol;
  readonly arrayInstance: ts.Symbol;
  readonly arrayType: ts.Symbol;
  readonly array: ts.Symbol;
  readonly booleanInstance: ts.Symbol;
  readonly booleanType: ts.Symbol;
  readonly boolean: ts.Symbol;
  readonly bufferInstance: ts.Symbol;
  readonly bufferType: ts.Symbol;
  readonly buffer: ts.Symbol;
  readonly consoleType: ts.Symbol;
  readonly console: ts.Symbol;
  readonly errorInstance: ts.Symbol;
  readonly errorType: ts.Symbol;
  readonly error: ts.Symbol;
  readonly functionInstance: ts.Symbol;
  readonly functionType: ts.Symbol;
  readonly function: ts.Symbol;
  readonly iterableInstance: ts.Symbol;
  readonly iterableIteratorInstance: ts.Symbol;
  readonly iteratorInstance: ts.Symbol;
  readonly iteratorResultInstance: ts.Symbol;
  readonly mapInstance: ts.Symbol;
  readonly mapType: ts.Symbol;
  readonly map: ts.Symbol;
  readonly objectInstance: ts.Symbol;
  readonly objectType: ts.Symbol;
  readonly object: ts.Symbol;
  readonly regexpInstance: ts.Symbol;
  readonly regexpType: ts.Symbol;
  readonly regexp: ts.Symbol;
  readonly numberInstance: ts.Symbol;
  readonly numberType: ts.Symbol;
  readonly number: ts.Symbol;
  readonly propertyDescriptorInstance: ts.Symbol;
  readonly stringInstance: ts.Symbol;
  readonly stringType: ts.Symbol;
  readonly string: ts.Symbol;
  readonly symbolInstance: ts.Symbol;
  readonly symbolType: ts.Symbol;
  readonly symbol: ts.Symbol;
  readonly templateStringsArrayInstance: ts.Symbol;
  readonly typedPropertyDescriptorInstance: ts.Symbol;
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

  const getTypeSymbol = (decl: ts.Declaration): ts.Symbol => {
    const type = tsUtils.type_.getType(typeChecker, decl);

    return tsUtils.type_.getSymbolOrThrow(type);
  };

  const getDeclSymbol = (decl: ts.Declaration): ts.Symbol => tsUtils.node.getSymbolOrThrow(typeChecker, decl);

  const getInstance = (name: string): ts.Symbol =>
    getTypeSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, name));
  const getType = (name: string): ts.Symbol => getTypeSymbol(tsUtils.statement.getInterfaceOrThrow(globalsFile, name));
  const getValue = (name: string): ts.Symbol =>
    getDeclSymbol(tsUtils.statement.getVariableDeclarationOrThrow(globalsFile, name));
  const getMember = (sym: ts.Symbol, name: string) => tsUtils.symbol.getMemberOrThrow(sym, name);

  // Arguments
  const argumentsInstance = getInstance('IArguments');
  builtIns.set(argumentsInstance, new ArgumentsInstance());

  // Array
  const arrayInstance = getInstance('Array');
  builtIns.set(arrayInstance, new ArrayInstance());
  builtIns.set(getMember(arrayInstance, 'filter'), new ArrayFilter());
  builtIns.set(getMember(arrayInstance, 'forEach'), new ArrayForEach());
  builtIns.set(getMember(arrayInstance, 'length'), new ArrayLength());
  builtIns.set(getMember(arrayInstance, 'map'), new ArrayMap());
  builtIns.set(getMember(arrayInstance, 'reduce'), new ArrayReduce());

  const arrayType = getType('ArrayConstructor');
  builtIns.set(arrayType, new ArrayType());

  // Boolean
  const booleanInstance = getInstance('Boolean');
  builtIns.set(booleanInstance, new BooleanInstance());

  const booleanType = getType('BooleanConstructor');
  builtIns.set(booleanType, new BooleanType());

  // Buffer
  const bufferInstance = getInstance('Buffer');
  builtIns.set(bufferInstance, new BufferInstance());
  builtIns.set(getMember(bufferInstance, 'equals'), new BufferEquals());

  const bufferType = getType('BufferConstructor');
  builtIns.set(bufferType, new BufferType());
  builtIns.set(getMember(bufferType, 'concat'), new BufferConcat());
  builtIns.set(getMember(bufferType, 'from'), new BufferFrom());

  // Console
  const consoleType = getType('Console');
  builtIns.set(consoleType, new ConsoleType());
  builtIns.set(getMember(consoleType, 'log'), new ConsoleLog());

  const consoleValue = getValue('console');
  builtIns.set(consoleValue, new ConsoleValue());

  // Error
  const errorInstance = getInstance('Error');
  builtIns.set(errorInstance, new ErrorInstance());

  const errorType = getType('ErrorConstructor');
  builtIns.set(errorType, new ErrorType());

  // Function
  const functionInstance = getInstance('Function');
  builtIns.set(functionInstance, new FunctionInstance());

  const functionType = getType('FunctionConstructor');
  builtIns.set(functionType, new FunctionType());

  // Iterable
  const iterableInstance = getInstance('Iterable');
  builtIns.set(iterableInstance, new IterableInstance());

  // IterableIterator
  const iterableIteratorInstance = getInstance('IterableIterator');
  builtIns.set(iterableIteratorInstance, new IterableIteratorInstance());

  // Iterator
  const iteratorInstance = getInstance('Iterator');
  builtIns.set(iteratorInstance, new IteratorInstance());

  // IteratorResult
  const iteratorResultInstance = getInstance('IteratorResult');
  builtIns.set(iteratorResultInstance, new IteratorResultInstance());

  // Map
  const mapInstance = getInstance('Map');
  builtIns.set(mapInstance, new MapInstance());

  const mapType = getType('MapConstructor');
  builtIns.set(mapType, new MapType());

  // Number
  const numberInstance = getInstance('Number');
  builtIns.set(numberInstance, new NumberInstance());

  const numberType = getType('NumberConstructor');
  builtIns.set(numberType, new NumberType());

  // Object
  const objectInstance = getInstance('Object');
  builtIns.set(objectInstance, new ObjectInstance());

  const objectType = getType('ObjectConstructor');
  builtIns.set(objectType, new ObjectType());
  builtIns.set(getMember(objectType, 'keys'), new ObjectKeys());

  // PropertyDescriptor
  const propertyDescriptorInstance = getInstance('PropertyDescriptor');
  builtIns.set(propertyDescriptorInstance, new PropertyDescriptorInstance());

  // RegExp
  const regexpInstance = getInstance('RegExp');
  builtIns.set(regexpInstance, new RegExpInstance());

  const regexpType = getType('RegExpConstructor');
  builtIns.set(regexpType, new RegExpType());

  // String
  const stringInstance = getInstance('String');
  builtIns.set(stringInstance, new StringInstance());

  const stringType = getType('String');
  builtIns.set(stringType, new StringType());

  // Symbol
  const symbolInstance = getInstance('Symbol');
  builtIns.set(symbolInstance, new SymbolInstance());

  const symbolType = getType('SymbolConstructor');
  builtIns.set(symbolType, new SymbolType());
  builtIns.set(getMember(symbolType, 'for'), new SymbolFor());
  builtIns.set(getMember(symbolType, 'iterator'), new SymbolIterator());
  builtIns.set(getMember(symbolType, 'toPrimitive'), new SymbolToPrimitive());

  // TemplateStringsArray
  const templateStringsArrayInstance = getInstance('TemplateStringsArray');
  builtIns.set(templateStringsArrayInstance, new TemplateStringsArrayInstance());

  // TypedPropertyDescriptor
  const typedPropertyDescriptorInstance = getInstance('TypedPropertyDescriptor');
  builtIns.set(typedPropertyDescriptorInstance, new TypedPropertyDescriptorInstance());

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
      argumentsInstance,
      arrayInstance,
      arrayType,
      array: arrayInstance,
      booleanInstance,
      booleanType,
      boolean: booleanInstance,
      bufferInstance,
      bufferType,
      buffer: bufferInstance,
      consoleType,
      console: consoleValue,
      errorInstance,
      errorType,
      error: errorInstance,
      functionInstance,
      functionType,
      function: functionInstance,
      iterableInstance,
      iterableIteratorInstance,
      iteratorInstance,
      iteratorResultInstance,
      mapInstance,
      mapType,
      map: mapInstance,
      objectInstance,
      objectType,
      object: objectInstance,
      regexpInstance,
      regexpType,
      regexp: regexpInstance,
      numberInstance,
      numberType,
      number: numberInstance,
      propertyDescriptorInstance,
      stringInstance,
      stringType,
      string: stringInstance,
      symbolInstance,
      symbolType,
      symbol: symbolInstance,
      templateStringsArrayInstance,
      typedPropertyDescriptorInstance,
    },
  };
};
