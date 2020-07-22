import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import ts from 'typescript';
import { DiagnosticOptions } from '../analysis';
import { Context } from '../Context';
import { toABIReturn } from '../utils';
import { AccessorPropInfo, ContractInfo } from './ContractInfoProcessor';

export interface DebugInfo {
  readonly entrypoint: string;
  readonly methods: readonly DebugMethod[];
  readonly events: readonly DebugEvent[];
  readonly documents: readonly string[];
}

interface DebugMethod {
  readonly id: string;
  readonly name: string;
  readonly range: readonly [number, number];
  readonly params: readonly string[];
  readonly returnType: string;
}

interface DebugEvent {
  readonly id: string;
  readonly name: string;
  readonly params: readonly string[];
}

export class DebugInfoProcessor {
  private readonly sourceFile: ts.SourceFile;
  private readonly endLine: number;

  public constructor(private readonly context: Context, private readonly contractInfo: ContractInfo) {
    this.sourceFile = contractInfo.smartContract.getSourceFile();
    this.endLine = this.sourceFile.getLineAndCharacterOfPosition(this.sourceFile.getEnd()).line;
  }

  public process(): DebugInfo {
    return {
      entrypoint: '',
      documents: [this.sourceFile.fileName],
      methods: this.processMethods(),
      events: [],
    };
  }

  private processMethods(): ReadonlyArray<DebugMethod> {
    const propInfos = this.contractInfo.propInfos.filter(utils.notNull);

    return _.flatten<DebugMethod>(
      propInfos.map(
        (propInfo): ReadonlyArray<DebugMethod> => {
          switch (propInfo.type) {
            case 'function':
              const funcRange = this.getSourceRange(propInfo.decl);

              if (funcRange === undefined) {
                return [];
              }

              return [
                {
                  id: '',
                  name: propInfo.name,
                  params: this.getParameters({
                    callSignature: propInfo.callSignature,
                    send: propInfo.send,
                    claim: propInfo.claim,
                  }),
                  range: funcRange,
                  returnType: this.toDebugReturn(propInfo.decl, propInfo.returnType),
                },
              ];

            case 'property':
              const propRange = this.getSourceRange(propInfo.decl);

              if (propRange === undefined) {
                return [];
              }

              return [
                {
                  id: '',
                  name: propInfo.name,
                  params: [],
                  range: propRange,
                  returnType: this.toDebugReturn(propInfo.decl, propInfo.propertyType),
                },
              ];

            case 'accessor':
              return [this.getGetterInfo(propInfo), this.getSetterInfo(propInfo)].filter(utils.notNull);

            default:
              return [];
          }
        },
      ),
    );
  }

  private getGetterInfo(propInfo: AccessorPropInfo): DebugMethod | undefined {
    if (propInfo.getter === undefined) {
      return undefined;
    }

    const range = this.getSourceRange(propInfo.getter.decl);
    if (range === undefined) {
      return undefined;
    }

    return {
      id: '',
      name: propInfo.getter.name,
      params: [],
      range,
      returnType: this.toDebugReturn(propInfo.getter.decl, propInfo.propertyType),
    };
  }

  private getSetterInfo(propInfo: AccessorPropInfo): DebugMethod | undefined {
    if (propInfo.setter === undefined) {
      return undefined;
    }

    const range = this.getSourceRange(propInfo.setter.decl);
    if (range === undefined) {
      return undefined;
    }

    return {
      id: '',
      name: propInfo.setter.name,
      params: [
        this.toDebugParameter(
          propInfo.name,
          propInfo.getter === undefined ? propInfo.setter.decl : propInfo.getter.decl,
          propInfo.propertyType,
          false,
          propInfo.getter === undefined ? { error: true } : undefined,
        ),
      ].filter(utils.notNull),
      range,
      returnType: 'Void',
    };
  }

  private getParameters({
    callSignature,
    claim = false,
    send = false,
  }: {
    readonly callSignature: ts.Signature | undefined;
    readonly claim?: boolean;
    readonly send?: boolean;
  }): ReadonlyArray<string> {
    if (callSignature === undefined) {
      return [];
    }

    let parameters = callSignature.getParameters();
    if (claim && this.checkLastParam(parameters, 'ClaimTransaction')) {
      parameters = parameters.slice(0, -1);
    }

    if (send && this.checkLastParam(parameters, 'Transfer')) {
      parameters = parameters.slice(0, -1);
    }

    return parameters.map((parameter) => this.paramToABIParameter(parameter)).filter(utils.notNull);
  }

  private paramToABIParameter(param: ts.Symbol): string | undefined {
    const decls = tsUtils.symbol.getDeclarations(param);
    const decl = utils.nullthrows(decls[0]);

    const initializer = tsUtils.initializer.getInitializer(decl);

    return this.toDebugParameter(
      tsUtils.symbol.getName(param),
      decl,
      this.getParamSymbolType(param),
      initializer !== undefined,
    );
  }

  private getParamSymbolType(param: ts.Symbol): ts.Type | undefined {
    const decls = tsUtils.symbol.getDeclarations(param);
    const decl = utils.nullthrows(decls[0]);

    return this.context.analysis.getTypeOfSymbol(param, decl);
  }

  private checkLastParam(parameters: ReadonlyArray<ts.Symbol>, value: string): boolean {
    return this.checkLastParamBase(parameters, (decl, type) => this.context.builtins.isInterface(decl, type, value));
  }

  private checkLastParamBase(
    parameters: ReadonlyArray<ts.Symbol>,
    checkParamType: (decl: ts.Node, type: ts.Type) => boolean,
  ): boolean {
    if (parameters.length === 0) {
      return false;
    }

    const lastParam = parameters[parameters.length - 1];
    const lastParamType = this.getParamSymbolType(lastParam);

    return lastParamType !== undefined && checkParamType(tsUtils.symbol.getDeclarations(lastParam)[0], lastParamType);
  }

  private toDebugParameter(
    nameIn: string,
    node: ts.Node,
    resolvedTypeIn: ts.Type | undefined,
    optional = false,
    options: DiagnosticOptions = { error: false, warning: false },
  ): string | undefined {
    const name = nameIn.startsWith('_') ? nameIn.slice(1) : nameIn;
    let resolvedType = resolvedTypeIn;
    if (ts.isParameter(node) && tsUtils.parameter.isRestParameter(node) && resolvedType !== undefined) {
      resolvedType = tsUtils.type_.getTypeArgumentsArray(resolvedType)[0];
    }

    const type = toABIReturn(this.context, node, resolvedType, optional, options);
    if (type === undefined) {
      return undefined;
    }

    return `${name},${type.type}`;
  }

  private toDebugReturn(
    node: ts.Node,
    resolvedType: ts.Type | undefined,
    optional = false,
    options: DiagnosticOptions = { error: false, warning: false },
  ): string {
    const type = toABIReturn(this.context, node, resolvedType, optional, options);

    return type === undefined ? 'Void' : type.type;
  }

  private getSourceRange(node: ts.Node): readonly [number, number] | undefined {
    try {
      const { line: start } = this.sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const { line: end } = this.sourceFile.getLineAndCharacterOfPosition(node.getEnd());

      if (start === this.endLine && end === this.endLine) {
        return undefined;
      }

      return [start, end];
    } catch {
      return undefined;
    }
  }
}
