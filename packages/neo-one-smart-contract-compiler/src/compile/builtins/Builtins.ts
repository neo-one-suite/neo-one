import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import * as path from 'path';
import ts from 'typescript';
import { Context, DiagnosticOptions } from '../../Context';
import { pathResolve } from '../../utils';
import { Builtin } from './types';

const NO_WARNING_ERROR = { error: false, warning: false };

const getMember = (sym: ts.Symbol, name: string) => tsUtils.symbol.getMemberOrThrow(sym, name);

const findNonNull = <T>(value: ReadonlyArray<T | undefined>): T | undefined => value.find((val) => val !== undefined);

const throwIfNull = <T>(value: T | undefined | null): T => {
  if (value == undefined) {
    /* istanbul ignore next */
    throw new Error('Something went wrong.');
  }

  return value;
};

export class Builtins {
  private readonly builtinMembers: Map<ts.Symbol, Map<ts.Symbol, Builtin>> = new Map();
  private readonly builtinInterfaces: Map<ts.Symbol, Builtin> = new Map();
  private readonly builtinValues: Map<ts.Symbol, Builtin> = new Map();

  public constructor(private readonly context: Context) {}

  public getMember(value: ts.Node, prop: ts.Node, options: DiagnosticOptions = NO_WARNING_ERROR): Builtin | undefined {
    const propSymbol = this.context.getSymbol(prop, options);

    if (propSymbol === undefined) {
      return undefined;
    }

    const valueSymbol = this.context.getTypeSymbol(value, options);
    if (valueSymbol === undefined) {
      return undefined;
    }

    const members = this.builtinMembers.get(valueSymbol);
    const member = members === undefined ? undefined : members.get(propSymbol);

    if (member === undefined) {
      // tslint:disable-next-line no-loop-statement
      for (const decl of tsUtils.symbol.getDeclarations(valueSymbol)) {
        if (ts.isInterfaceDeclaration(decl)) {
          // tslint:disable-next-line no-loop-statement
          for (const clause of tsUtils.heritage.getHeritageClauses(decl)) {
            // tslint:disable-next-line no-loop-statement
            for (const type of tsUtils.heritage.getTypeNodes(clause)) {
              const foundMember = this.getMember(tsUtils.expression.getExpression(type), prop, options);
              if (foundMember !== undefined) {
                return foundMember;
              }
            }
          }
        }
      }
    }

    return member;
  }

  public getOnlyMember(value: string, name: string): Builtin | undefined {
    return this.getOnlyMemberBase(value, name, (result) => result[1]);
  }

  public getOnlyMemberSymbol(value: string, name: string): ts.Symbol {
    return throwIfNull(this.getOnlyMemberBase(value, name, (result) => result[0]));
  }

  public getMembers<T extends Builtin>(
    name: string,
    isMember: (builtin: Builtin) => builtin is T,
    isEligible: (builtin: T) => boolean,
    symbolMembers = false,
  ): ReadonlyArray<[string, T]> {
    let testKey = (key: string) => !key.startsWith('__@');
    let modifyKey = (key: string) => key;
    if (symbolMembers) {
      testKey = (key) => key.startsWith('__@');
      modifyKey = (key) => key.slice(3);
    }

    const interfaceSymbol = this.getAnyInterfaceSymbol(name);
    const members = this.builtinMembers.get(interfaceSymbol);
    if (members === undefined) {
      return [];
    }

    const mutableMembers: Array<[string, T]> = [];
    members.forEach((builtin, memberSymbol) => {
      const memberName = tsUtils.symbol.getName(memberSymbol);
      if (isMember(builtin) && testKey(memberName) && isEligible(builtin)) {
        mutableMembers.push([modifyKey(memberName), builtin]);
      }
    });

    return mutableMembers;
  }

  public getInterface(value: ts.Node, options: DiagnosticOptions = NO_WARNING_ERROR): Builtin | undefined {
    const valueSymbol = this.context.getSymbol(value, options);
    if (valueSymbol === undefined) {
      return undefined;
    }

    return this.builtinInterfaces.get(valueSymbol);
  }

  public getInterfaceSymbol(value: string): ts.Symbol {
    return this.getAnyInterfaceSymbol(value);
  }

  public getValue(value: ts.Node, options: DiagnosticOptions = NO_WARNING_ERROR): Builtin | undefined {
    const valueSymbol = this.context.getSymbol(value, options);
    if (valueSymbol === undefined) {
      return undefined;
    }

    return this.builtinValues.get(valueSymbol);
  }

  public getValueSymbol(value: string): ts.Symbol {
    return this.getAnyValueSymbol(value);
  }

  public getTypeSymbol(name: string): ts.Symbol {
    return this.getAnyTypeSymbol(name);
  }

  public hasInterface(node: ts.Node, type: ts.Type, name: string): boolean {
    return tsUtils.type_.hasType(type, (testType) => this.isInterface(node, testType, name));
  }

  public isInterface(
    node: ts.Node,
    testType: ts.Type,
    name: string,
    options: DiagnosticOptions = NO_WARNING_ERROR,
  ): boolean {
    const symbol = this.context.getSymbolForType(node, testType, options);
    if (symbol === undefined) {
      return false;
    }

    const interfaceSymbol = this.getAnyInterfaceSymbol(name);

    if (symbol === interfaceSymbol) {
      return true;
    }

    // tslint:disable-next-line no-loop-statement
    for (const decl of tsUtils.symbol.getDeclarations(interfaceSymbol)) {
      if (ts.isInterfaceDeclaration(decl)) {
        // tslint:disable-next-line no-loop-statement
        for (const clause of tsUtils.heritage.getHeritageClauses(decl)) {
          // tslint:disable-next-line no-loop-statement
          for (const type of tsUtils.heritage.getTypeNodes(clause)) {
            const expr = tsUtils.expression.getExpression(type);
            if (ts.isIdentifier(expr)) {
              const isInterface = this.isInterface(node, testType, tsUtils.node.getText(expr), options);
              if (isInterface) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  public isType(
    node: ts.Node,
    testType: ts.Type,
    name: string,
    options: DiagnosticOptions = NO_WARNING_ERROR,
  ): boolean {
    const symbol = this.context.getSymbolForType(node, testType, options);
    if (symbol === undefined) {
      return false;
    }

    const typeSymbol = this.getAnyTypeSymbol(name);

    return symbol === typeSymbol;
  }

  public isValue(node: ts.Node, name: string, options: DiagnosticOptions = NO_WARNING_ERROR): boolean {
    const symbol = this.context.getSymbol(node, options);
    if (symbol === undefined) {
      return false;
    }

    const valueSymbol = this.getAnyValueSymbol(name);

    return symbol === valueSymbol;
  }

  public addMember(value: string, member: string, builtin: Builtin): void {
    this.addMemberBase(value, member, builtin, this.getGlobals());
  }

  public addContractMember(value: string, member: string, builtin: Builtin): void {
    this.addMemberBase(value, member, builtin, this.getContract());
  }

  public addInterface(value: string, builtin: Builtin): void {
    this.addInterfaceBase(value, builtin, this.getGlobals());
  }

  public addContractInterface(value: string, builtin: Builtin): void {
    this.addInterfaceBase(value, builtin, this.getContract());
  }

  public addValue(value: string, builtin: Builtin): void {
    this.addValueBase(value, builtin, this.getGlobals());
  }

  public addTestValue(value: string, builtin: Builtin): void {
    const file = this.getTestGlobals();
    if (file === undefined) {
      return;
    }

    this.addValueBase(value, builtin, file);
  }

  public addContractValue(value: string, builtin: Builtin): void {
    this.addValueBase(value, builtin, this.getContract());
  }

  public addInternalValue(value: string, builtin: Builtin): void {
    this.addValueBase(value, builtin, this.getInternal());
  }

  private getOnlyMemberBase<T>(
    value: string,
    name: string,
    getValue: (value: [ts.Symbol, Builtin]) => T,
  ): T | undefined {
    const interfaceSymbol = this.getAnyInterfaceSymbol(value);
    const members = this.builtinMembers.get(interfaceSymbol);
    if (members === undefined) {
      return undefined;
    }

    const result = [...members.entries()].find(([symbol]) => tsUtils.symbol.getName(symbol) === name);

    if (result === undefined) {
      // tslint:disable-next-line no-loop-statement
      for (const decl of tsUtils.symbol.getDeclarations(interfaceSymbol)) {
        if (ts.isInterfaceDeclaration(decl)) {
          // tslint:disable-next-line no-loop-statement
          for (const clause of tsUtils.heritage.getHeritageClauses(decl)) {
            // tslint:disable-next-line no-loop-statement
            for (const type of tsUtils.heritage.getTypeNodes(clause)) {
              const expr = tsUtils.expression.getExpression(type);
              if (ts.isIdentifier(expr)) {
                const member = this.getOnlyMemberBase(tsUtils.node.getText(expr), name, getValue);
                if (member !== undefined) {
                  return member;
                }
              }
            }
          }
        }
      }
    }

    return result === undefined ? undefined : getValue(result);
  }

  private addMemberBase(value: string, member: string, builtin: Builtin, file: ts.SourceFile): void {
    const valueSymbol = this.getInterfaceSymbolBase(value, file);
    let members = this.builtinMembers.get(valueSymbol);
    if (members === undefined) {
      members = new Map();
      this.builtinMembers.set(valueSymbol, members);
    }

    const memberSymbol = getMember(valueSymbol, member);
    members.set(memberSymbol, builtin);
    const memberSymbolName = tsUtils.symbol.getName(memberSymbol);
    if (memberSymbolName.startsWith('__@')) {
      const symbolSymbol = this.getInterfaceSymbolBase('SymbolConstructor', file);
      members.set(getMember(symbolSymbol, memberSymbolName.slice(3)), builtin);
    }
  }

  private addInterfaceBase(value: string, builtin: Builtin, file: ts.SourceFile): void {
    this.builtinInterfaces.set(this.getInterfaceSymbolBase(value, file), builtin);
  }

  private addValueBase(value: string, builtin: Builtin, file: ts.SourceFile): void {
    this.builtinValues.set(this.getValueSymbolBase(value, file), builtin);
  }

  private getAnyValueSymbol(name: string): ts.Symbol {
    return throwIfNull(this.getAnyValueSymbolMaybe(name));
  }

  private getAnyValueSymbolMaybe(name: string): ts.Symbol | undefined {
    return findNonNull(this.getFiles().map((file) => this.getValueSymbolMaybe(name, file)));
  }

  private getValueSymbolBase(name: string, file: ts.SourceFile): ts.Symbol {
    return throwIfNull(this.getValueSymbolMaybe(name, file));
  }

  private getValueSymbolMaybe(name: string, file: ts.SourceFile): ts.Symbol | undefined {
    let decl: ts.Declaration | undefined = tsUtils.statement.getVariableDeclaration(file, name);
    if (decl === undefined) {
      decl = tsUtils.statement.getFunction(file, name);
    }

    if (decl === undefined) {
      decl = tsUtils.statement.getEnum(file, name);
    }

    if (decl === undefined) {
      return undefined;
    }

    return tsUtils.node.getSymbol(this.context.typeChecker, decl);
  }

  private getAnyInterfaceSymbol(name: string): ts.Symbol {
    return throwIfNull(this.getAnyInterfaceSymbolMaybe(name));
  }

  private getAnyInterfaceSymbolMaybe(name: string): ts.Symbol | undefined {
    return findNonNull(this.getFiles().map((file) => this.getInterfaceSymbolMaybe(name, file)));
  }

  private getInterfaceSymbolBase(name: string, file: ts.SourceFile): ts.Symbol {
    return throwIfNull(this.getInterfaceSymbolMaybe(name, file));
  }

  private getInterfaceSymbolMaybe(name: string, file: ts.SourceFile): ts.Symbol | undefined {
    let decl: ts.Declaration | undefined = tsUtils.statement.getInterface(file, name);

    if (decl === undefined) {
      decl = tsUtils.statement.getEnum(file, name);
    }

    if (decl === undefined) {
      return undefined;
    }

    const type = tsUtils.type_.getType(this.context.typeChecker, decl);

    return tsUtils.type_.getSymbol(type);
  }

  private getAnyTypeSymbol(name: string): ts.Symbol {
    return throwIfNull(this.getAnyTypeSymbolMaybe(name));
  }

  private getAnyTypeSymbolMaybe(name: string): ts.Symbol | undefined {
    return findNonNull(this.getFiles().map((file) => this.getTypeSymbolMaybe(name, file)));
  }

  private getTypeSymbolMaybe(name: string, file: ts.SourceFile): ts.Symbol | undefined {
    const decl = tsUtils.statement.getTypeAlias(file, name);
    if (decl === undefined) {
      return undefined;
    }

    const type = tsUtils.type_.getType(this.context.typeChecker, decl);

    return tsUtils.type_.getAliasSymbol(type);
  }

  private getFiles(): ReadonlyArray<ts.SourceFile> {
    return [this.getGlobals(), this.getContract(), this.getTestGlobals()].filter(utils.notNull);
  }

  private getGlobals(): ts.SourceFile {
    return tsUtils.file.getSourceFileOrThrow(
      this.context.program,
      pathResolve(path.dirname(require.resolve('@neo-one/smart-contract')), 'global.d.ts'),
    );
  }

  private getContract(): ts.SourceFile {
    return tsUtils.file.getSourceFileOrThrow(
      this.context.program,
      pathResolve(path.dirname(require.resolve('@neo-one/smart-contract')), 'index.d.ts'),
    );
  }

  private getInternal(): ts.SourceFile {
    return tsUtils.file.getSourceFileOrThrow(
      this.context.program,
      pathResolve(path.dirname(require.resolve('@neo-one/smart-contract')), 'internal.d.ts'),
    );
  }

  private getTestGlobals(): ts.SourceFile | undefined {
    return tsUtils.file.getSourceFile(
      this.context.program,
      pathResolve(path.dirname(require.resolve('@neo-one/smart-contract')), 'harness.d.ts'),
    );
  }
}
