import { tsUtils } from '@neo-one/ts-utils';
import * as path from 'path';
import ts from 'typescript';
import { Context } from '../../Context';
import { pathResolve } from '../../utils';
import { Builtin } from './types';

const NO_WARNING_ERROR = { error: false, warning: false };

const getMember = (sym: ts.Symbol, name: string) => tsUtils.symbol.getMemberOrThrow(sym, name);

export class Builtins {
  private readonly builtinMembers: Map<ts.Symbol, Map<ts.Symbol, Builtin>> = new Map();
  private readonly builtinInterfaces: Map<ts.Symbol, Builtin> = new Map();
  private readonly builtinValues: Map<ts.Symbol, Builtin> = new Map();

  public getMember(context: Context, value: ts.Node, prop: ts.Node): Builtin | undefined {
    const propSymbol = context.getSymbol(prop, NO_WARNING_ERROR);

    if (propSymbol === undefined) {
      return undefined;
    }

    const valueSymbol = context.getTypeSymbol(value, NO_WARNING_ERROR);
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
              const foundMember = this.getMember(context, tsUtils.expression.getExpression(type), prop);
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

  public getOnlyMember(context: Context, value: string, name: string): Builtin | undefined {
    const interfaceSymbol = this.getInterfaceSymbol(context, value);
    const members = this.builtinMembers.get(interfaceSymbol);
    if (members === undefined) {
      return undefined;
    }

    const result = [...members.entries()].find(([symbol]) => tsUtils.symbol.getName(symbol) === name);

    return result === undefined ? undefined : result[1];
  }

  public getMembers<T extends Builtin>(
    context: Context,
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

    const interfaceSymbol = this.getInterfaceSymbol(context, name);
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

  public getInterface(context: Context, value: ts.Node): Builtin | undefined {
    const valueSymbol = context.getSymbol(value, NO_WARNING_ERROR);
    if (valueSymbol === undefined) {
      return undefined;
    }

    return this.builtinInterfaces.get(valueSymbol);
  }

  public getValue(context: Context, value: ts.Node): Builtin | undefined {
    const valueSymbol = context.getSymbol(value, NO_WARNING_ERROR);
    if (valueSymbol === undefined) {
      return undefined;
    }

    return this.builtinValues.get(valueSymbol);
  }

  public addMember(context: Context, value: string, member: string, builtin: Builtin): void {
    const valueSymbol = this.getInterfaceSymbol(context, value);
    let members = this.builtinMembers.get(valueSymbol);
    if (members === undefined) {
      members = new Map();
      this.builtinMembers.set(valueSymbol, members);
    }

    const memberSymbol = getMember(valueSymbol, member);
    members.set(memberSymbol, builtin);
    const memberSymbolName = tsUtils.symbol.getName(memberSymbol);
    if (memberSymbolName.startsWith('__@')) {
      const symbolSymbol = this.getInterfaceSymbol(context, 'SymbolConstructor');
      members.set(getMember(symbolSymbol, memberSymbolName.slice(3)), builtin);
    }
  }

  public addInterface(context: Context, value: string, builtin: Builtin): void {
    this.builtinInterfaces.set(this.getInterfaceSymbol(context, value), builtin);
  }

  public addValue(context: Context, value: string, builtin: Builtin): void {
    this.builtinValues.set(this.getValueSymbol(context, value), builtin);
  }

  public addTestValue(context: Context, value: string, builtin: Builtin): void {
    const sourceFile = this.getTestGlobals(context);
    if (sourceFile === undefined) {
      return;
    }

    this.builtinValues.set(this.getValueSymbol(context, value, sourceFile), builtin);
  }

  private getValueSymbol(context: Context, name: string, sourceFile = this.getGlobals(context)): ts.Symbol {
    let decl: ts.Declaration | undefined = tsUtils.statement.getVariableDeclaration(sourceFile, name);
    if (decl === undefined) {
      decl = tsUtils.statement.getFunction(sourceFile, name);
    }

    if (decl === undefined) {
      throw new Error('Expected declaration');
    }

    return tsUtils.node.getSymbolOrThrow(context.typeChecker, decl);
  }

  private getInterfaceSymbol(context: Context, name: string): ts.Symbol {
    const decl = tsUtils.statement.getInterfaceOrThrow(this.getGlobals(context), name);
    const type = tsUtils.type_.getType(context.typeChecker, decl);

    return tsUtils.type_.getSymbolOrThrow(type);
  }

  private getGlobals(context: Context): ts.SourceFile {
    return tsUtils.file.getSourceFileOrThrow(
      context.program,
      pathResolve(path.dirname(require.resolve('@neo-one/smart-contract')), 'global.d.ts'),
    );
  }

  private getTestGlobals(context: Context): ts.SourceFile | undefined {
    return tsUtils.file.getSourceFile(
      context.program,
      pathResolve(path.dirname(require.resolve('@neo-one/smart-contract')), 'harness.d.ts'),
    );
  }
}
