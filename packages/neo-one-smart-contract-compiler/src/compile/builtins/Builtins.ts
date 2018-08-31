import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import ts from 'typescript';
import { Context } from '../../Context';
import { createMemoized, nodeKey, pathResolve, symbolKey, typeKey } from '../../utils';
import { Builtin, isBuiltinValueObject } from './types';

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
  private readonly memoized = createMemoized();

  public constructor(private readonly context: Context) {}

  public getMember(value: ts.Node, prop: ts.Node): Builtin | undefined {
    return this.memoized('get-member', `${nodeKey(value)}:${nodeKey(prop)}`, () => {
      const propSymbol = this.context.analysis.getSymbol(prop);

      if (propSymbol === undefined) {
        return undefined;
      }

      const valueSymbol = this.context.analysis.getTypeSymbol(value);
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
                const foundMember = this.getMember(tsUtils.expression.getExpression(type), prop);
                if (foundMember !== undefined) {
                  return foundMember;
                }
              }
            }
          }
        }
      }

      return member;
    });
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

  public getInterface(value: ts.Node): Builtin | undefined {
    const valueSymbol = this.context.analysis.getSymbol(value);
    if (valueSymbol === undefined) {
      return undefined;
    }

    return this.builtinInterfaces.get(valueSymbol);
  }

  public getInterfaceSymbol(value: string): ts.Symbol {
    return this.getAnyInterfaceSymbol(value);
  }

  public getValue(value: ts.Node): Builtin | undefined {
    const valueSymbol = this.context.analysis.getSymbol(value);
    if (valueSymbol === undefined) {
      return undefined;
    }

    return this.builtinValues.get(valueSymbol);
  }

  public getValueInterface(value: ts.Node): string | undefined {
    const builtinValue = this.getValue(value);

    return builtinValue === undefined || !isBuiltinValueObject(builtinValue) ? undefined : builtinValue.type;
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

  public isInterface(node: ts.Node, testType: ts.Type, name: string): boolean {
    return this.memoized('is-interface', `${typeKey(testType)}:${name}`, () => {
      const symbol = this.context.analysis.getSymbolForType(node, testType);
      if (symbol === undefined) {
        return false;
      }

      const interfaceSymbol = this.getAnyInterfaceSymbol(name);

      return symbol === interfaceSymbol;
    });
  }

  public isType(node: ts.Node, testType: ts.Type, name: string): boolean {
    return this.memoized('is-type', `${typeKey(testType)}:${name}`, () => {
      const symbol = this.context.analysis.getSymbolForType(node, testType);
      if (symbol === undefined) {
        return false;
      }

      const typeSymbol = this.getAnyTypeSymbol(name);

      return symbol === typeSymbol;
    });
  }

  public isValue(node: ts.Node, name: string): boolean {
    return this.memoized('is-value', `${nodeKey(node)}:${name}`, () => {
      const symbol = this.context.analysis.getSymbol(node);
      if (symbol === undefined) {
        return false;
      }

      const valueSymbol = this.getAnyValueSymbol(name);

      return symbol === valueSymbol;
    });
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
    return this.memoized('only-member-base', `${value}$${name}`, () => {
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
    });
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
      const symbolSymbol = this.getInterfaceSymbolBase('SymbolConstructor', this.getGlobals());
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
    return this.memoized('any-value-symbol', name, () => throwIfNull(this.getAnyValueSymbolMaybe(name)));
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
    return this.memoized('any-interface-symbol', name, () => throwIfNull(this.getAnyInterfaceSymbolMaybe(name)));
  }

  private getAnyInterfaceSymbolMaybe(name: string): ts.Symbol | undefined {
    return findNonNull(this.getFiles().map((file) => this.getInterfaceSymbolMaybe(name, file)));
  }

  private getInterfaceSymbolBase(name: string, file: ts.SourceFile): ts.Symbol {
    return throwIfNull(this.getInterfaceSymbolMaybe(name, file));
  }

  private getInterfaceSymbolMaybe(name: string, file: ts.SourceFile): ts.Symbol | undefined {
    return this.getInterfaceSymbols(file)[name];
  }

  private getInterfaceSymbols(file: ts.SourceFile): { readonly [key: string]: ts.Symbol | undefined } {
    return this.memoized('interface-symbols', tsUtils.file.getFilePath(file), () => {
      const interfaceDecls: ReadonlyArray<ts.Declaration> = tsUtils.statement.getInterfaces(file);
      const decls = interfaceDecls.concat(tsUtils.statement.getEnums(file));

      return _.fromPairs(
        decls.map((decl) => {
          const type = tsUtils.type_.getType(this.context.typeChecker, decl);

          const symbol = tsUtils.type_.getSymbol(type);

          return [tsUtils.node.getName(decl), symbol];
        }),
      );
    });
  }

  private getInheritedInterfaceSymbols(symbol: ts.Symbol): Set<ts.Symbol> {
    return this.memoized('inherited-interface-symbols', symbolKey(symbol), () => {
      const symbols = new Set();
      // tslint:disable-next-line no-loop-statement
      for (const decl of tsUtils.symbol.getDeclarations(symbol)) {
        if (ts.isInterfaceDeclaration(decl)) {
          // tslint:disable-next-line no-loop-statement
          for (const clause of tsUtils.heritage.getHeritageClauses(decl)) {
            // tslint:disable-next-line no-loop-statement
            for (const type of tsUtils.heritage.getTypeNodes(clause)) {
              const expr = tsUtils.expression.getExpression(type);
              if (ts.isIdentifier(expr)) {
                const interfaceSymbol = this.getAnyInterfaceSymbol(tsUtils.node.getText(expr));
                this.getInheritedInterfaceSymbols(interfaceSymbol).forEach((inheritedSymbol) => {
                  symbols.add(inheritedSymbol);
                });
              }
            }
          }
        }
      }

      return symbols;
    });
  }

  private getAnyTypeSymbol(name: string): ts.Symbol {
    return this.memoized('any-type-symbol', name, () => throwIfNull(this.getAnyTypeSymbolMaybe(name)));
  }

  private getAnyTypeSymbolMaybe(name: string): ts.Symbol | undefined {
    return findNonNull(this.getFiles().map((file) => this.getTypeSymbolMaybe(name, file)));
  }

  private getTypeSymbolMaybe(name: string, file: ts.SourceFile): ts.Symbol | undefined {
    return this.getTypeSymbols(file)[name];
  }

  private getTypeSymbols(file: ts.SourceFile): { readonly [key: string]: ts.Symbol | undefined } {
    return this.memoized('type-symbols', tsUtils.file.getFilePath(file), () => {
      const decls: ReadonlyArray<ts.Declaration> = tsUtils.statement.getTypeAliases(file);

      return _.fromPairs(
        decls.map((decl) => {
          const type = tsUtils.type_.getType(this.context.typeChecker, decl);

          const symbol = tsUtils.type_.getAliasSymbol(type);

          return [tsUtils.node.getName(decl), symbol];
        }),
      );
    });
  }

  private getFiles(): ReadonlyArray<ts.SourceFile> {
    return this.memoized('file-cache', 'files', () =>
      [this.getGlobals(), this.getContract(), this.getTestGlobals()].filter(utils.notNull),
    );
  }

  private getGlobals(): ts.SourceFile {
    return this.memoized('file-cache', 'globals', () =>
      tsUtils.file.getSourceFileOrThrow(
        this.context.program,
        pathResolve(this.context.smartContractDir, 'global.d.ts'),
      ),
    );
  }

  private getContract(): ts.SourceFile {
    return this.memoized('file-cache', 'contract', () =>
      tsUtils.file.getSourceFileOrThrow(this.context.program, pathResolve(this.context.smartContractDir, 'index.d.ts')),
    );
  }

  private getInternal(): ts.SourceFile {
    return this.memoized('file-cache', 'internal', () =>
      tsUtils.file.getSourceFileOrThrow(
        this.context.program,
        pathResolve(this.context.smartContractDir, 'internal.d.ts'),
      ),
    );
  }

  private getTestGlobals(): ts.SourceFile | undefined {
    return this.memoized('file-cache', 'test', () =>
      tsUtils.file.getSourceFile(this.context.program, pathResolve(this.context.smartContractDir, 'harness.d.ts')),
    );
  }
}
