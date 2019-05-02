import { ABI, ABIEvent, ABIFunction, ABIParameter, ABIReturn, SenderAddressABIDefault } from '@neo-one/client-common';
import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import ts from 'typescript';
import { DEFAULT_DIAGNOSTIC_OPTIONS, DiagnosticOptions } from '../analysis';
import { Context } from '../Context';
import { DiagnosticCode } from '../DiagnosticCode';
import { DiagnosticMessage } from '../DiagnosticMessage';
import { getSetterName, toABIReturn } from '../utils';
import { ContractInfo, DeployPropInfo } from './ContractInfoProcessor';

const BOOLEAN_RETURN: ABIReturn = { type: 'Boolean' };
const VOID_RETURN: ABIReturn = { type: 'Void' };

export class ABISmartContractProcessor {
  public constructor(private readonly context: Context, private readonly contractInfo: ContractInfo) {}

  public process(): ABI {
    return {
      functions: this.processFunctions(),
      events: this.processEvents(),
    };
  }

  private processFunctions(): readonly ABIFunction[] {
    const deployInfo = this.findDeployInfo();
    const propInfos = this.contractInfo.propInfos
      .filter((propInfo) => propInfo.isPublic && propInfo.type !== 'deploy')
      .concat([deployInfo].filter(utils.notNull));

    return _.flatten<ABIFunction>(
      propInfos.map(
        (propInfo): readonly ABIFunction[] => {
          switch (propInfo.type) {
            case 'deploy':
              return [
                {
                  name: propInfo.name,
                  parameters: propInfo.isMixinDeploy
                    ? []
                    : this.getParameters({ callSignature: propInfo.callSignature }),
                  returnType: BOOLEAN_RETURN,
                },
              ];
            case 'refundAssets':
              return [
                {
                  name: propInfo.name,
                  sendUnsafe: true,
                  parameters: [],
                  returnType: BOOLEAN_RETURN,
                },
              ];
            case 'completeSend':
              return [
                {
                  name: propInfo.name,
                  completeSend: true,
                  parameters: [],
                  returnType: BOOLEAN_RETURN,
                },
              ];
            case 'upgrade':
              return [
                {
                  name: propInfo.name,
                  parameters: [
                    { name: 'script', type: 'Buffer' },
                    { name: 'parameterList', type: 'Buffer' },
                    { name: 'returnType', type: 'Integer', decimals: 0 },
                    { name: 'properties', type: 'Integer', decimals: 0 },
                    { name: 'contractName', type: 'String' },
                    { name: 'codeVersion', type: 'String' },
                    { name: 'author', type: 'String' },
                    { name: 'email', type: 'String' },
                    { name: 'description', type: 'String' },
                  ],
                  returnType: BOOLEAN_RETURN,
                },
              ];
            case 'function':
              return [
                {
                  name: propInfo.name,
                  parameters: this.getParameters({
                    callSignature: propInfo.callSignature,
                    send: propInfo.send,
                    claim: propInfo.claim,
                  }),
                  returnType: this.toABIReturn(propInfo.decl, propInfo.returnType),
                  constant: propInfo.constant,
                  send: propInfo.send,
                  sendUnsafe: propInfo.sendUnsafe,
                  receive: propInfo.receive,
                  claim: propInfo.claim,
                },
              ];
            case 'property':
              return [
                {
                  name: propInfo.name,
                  parameters: [],
                  returnType: this.toABIReturn(propInfo.decl, propInfo.propertyType),
                  constant: true,
                },
                propInfo.isReadonly
                  ? undefined
                  : {
                      name: getSetterName(propInfo.name),
                      parameters: [
                        this.toABIParameter(propInfo.name, propInfo.decl, propInfo.propertyType, false, {
                          error: false,
                        }),
                      ].filter(utils.notNull),
                      returnType: VOID_RETURN,
                    },
              ].filter(utils.notNull);
            case 'accessor':
              return [
                propInfo.getter === undefined
                  ? undefined
                  : {
                      name: propInfo.getter.name,
                      parameters: [],
                      constant: propInfo.getter.constant,
                      returnType: this.toABIReturn(propInfo.getter.decl, propInfo.propertyType),
                    },
                propInfo.setter === undefined
                  ? undefined
                  : {
                      name: propInfo.setter.name,
                      parameters: [
                        this.toABIParameter(
                          propInfo.name,
                          propInfo.getter === undefined ? propInfo.setter.decl : propInfo.getter.decl,
                          propInfo.propertyType,
                          false,
                          propInfo.getter === undefined ? { error: true } : undefined,
                        ),
                      ].filter(utils.notNull),
                      returnType: VOID_RETURN,
                    },
              ].filter(utils.notNull);
            default:
              utils.assertNever(propInfo);
              throw new Error('For TS');
          }
        },
      ),
    );
  }

  private findDeployInfo(contractInfo: ContractInfo = this.contractInfo): DeployPropInfo | undefined {
    const deployInfo = contractInfo.propInfos.find(
      (propInfo): propInfo is DeployPropInfo => propInfo.type === 'deploy',
    );
    const superSmartContract = contractInfo.superSmartContract;
    if (deployInfo !== undefined) {
      if (deployInfo.decl === undefined && superSmartContract !== undefined) {
        const superDeployInfo = this.findDeployInfo(superSmartContract);

        return superDeployInfo === undefined ? deployInfo : superDeployInfo;
      }

      return deployInfo;
    }

    return superSmartContract === undefined ? undefined : this.findDeployInfo(superSmartContract);
  }

  private getParameters({
    callSignature,
    claim = false,
    send = false,
  }: {
    readonly callSignature: ts.Signature | undefined;
    readonly claim?: boolean;
    readonly send?: boolean;
  }): readonly ABIParameter[] {
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

  private processEvents(): readonly ABIEvent[] {
    const createEventNotifierDecl = tsUtils.symbol.getDeclarations(
      this.context.builtins.getValueSymbol('createEventNotifier'),
    )[0];
    const declareEventDecl = tsUtils.symbol.getDeclarations(this.context.builtins.getValueSymbol('declareEvent'))[0];

    const calls = this.context.analysis
      .findReferencesAsNodes(createEventNotifierDecl)
      .concat(this.context.analysis.findReferencesAsNodes(declareEventDecl))
      .map((node) => {
        if (ts.isIdentifier(node)) {
          const parent = tsUtils.node.getParent(node);
          if (ts.isCallExpression(parent)) {
            return parent;
          }
        }

        return undefined;
      })
      .filter(utils.notNull);

    return calls.reduce<readonly ABIEvent[]>((events, call) => {
      const event = this.toABIEvent(call, events);

      return event === undefined ? events : [...events, event];
    }, []);
  }

  private toABIEvent(call: ts.CallExpression, events: readonly ABIEvent[]): ABIEvent | undefined {
    const callArguments = tsUtils.argumented.getArguments(call);
    const parent = tsUtils.node.getParent(call);

    let typeArguments = tsUtils.argumented
      .getTypeArgumentsArray(call)
      .map((typeNode) => this.context.analysis.getType(typeNode));
    if (ts.isPropertyDeclaration(parent)) {
      const propertyName = tsUtils.node.getName(parent);
      const smartContractType = this.context.analysis.getType(this.contractInfo.smartContract);
      if (smartContractType !== undefined) {
        const member = tsUtils.type_.getProperty(smartContractType, propertyName);
        if (member !== undefined) {
          const type = this.context.analysis.getTypeOfSymbol(member, this.contractInfo.smartContract);
          const signatureTypes = this.context.analysis.extractSignatureForType(call, type);
          if (signatureTypes !== undefined) {
            typeArguments = signatureTypes.paramDecls.map((paramDecl) => signatureTypes.paramTypes.get(paramDecl));
          }
        }
      }
    }

    const nameArg = callArguments[0] as ts.Node | undefined;
    if (nameArg === undefined) {
      return undefined;
    }

    if (!ts.isStringLiteral(nameArg)) {
      this.context.reportError(
        nameArg,
        DiagnosticCode.InvalidContractEvent,
        DiagnosticMessage.InvalidContractEventNameStringLiteral,
      );

      return undefined;
    }
    const name = tsUtils.literal.getLiteralValue(nameArg);

    const parameters = _.zip(callArguments.slice(1), typeArguments)
      .map(([paramNameArg, paramType]) => {
        if (paramNameArg === undefined || paramType === undefined) {
          return undefined;
        }

        if (!ts.isStringLiteral(paramNameArg)) {
          this.context.reportError(
            paramNameArg,
            DiagnosticCode.InvalidContractEvent,
            DiagnosticMessage.InvalidContractEventArgStringLiteral,
          );

          return undefined;
        }

        const paramName = tsUtils.literal.getLiteralValue(paramNameArg);

        const param = this.toABIParameter(paramName, paramNameArg, paramType);

        if (param !== undefined && param.type === 'ForwardValue') {
          this.context.reportError(
            paramNameArg,
            DiagnosticCode.InvalidContractType,
            DiagnosticMessage.InvalidContractType,
          );

          return undefined;
        }

        return param;
      })
      .filter(utils.notNull);

    const event = { name, parameters };

    const dupeEvent = events.find((otherEvent) => otherEvent.name === event.name && !_.isEqual(event, otherEvent));
    if (dupeEvent === undefined) {
      return event;
    }

    this.context.reportError(
      nameArg,
      DiagnosticCode.InvalidContractEvent,
      DiagnosticMessage.InvalidContractEventDuplicate,
    );

    return undefined;
  }

  private paramToABIParameter(param: ts.Symbol): ABIParameter | undefined {
    const decls = tsUtils.symbol.getDeclarations(param);
    const decl = utils.nullthrows(decls[0]);

    const initializer = tsUtils.initializer.getInitializer(decl);
    const parameter = this.toABIParameter(
      tsUtils.symbol.getName(param),
      decl,
      this.getParamSymbolType(param),
      initializer !== undefined,
    );

    if (
      parameter === undefined ||
      initializer === undefined ||
      (!ts.isPropertyAccessExpression(initializer) && !ts.isCallExpression(initializer))
    ) {
      return parameter;
    }

    if (ts.isPropertyAccessExpression(initializer)) {
      const symbol = this.context.analysis.getSymbol(initializer);
      const senderAddress = this.context.builtins.getOnlyMemberSymbol('DeployConstructor', 'senderAddress');

      if (symbol === senderAddress) {
        const sender: SenderAddressABIDefault = { type: 'sender' };

        return { ...parameter, default: sender };
      }
    }

    return parameter;
  }

  private checkLastParam(parameters: readonly ts.Symbol[], value: string): boolean {
    return this.checkLastParamBase(parameters, (decl, type) => this.context.builtins.isInterface(decl, type, value));
  }

  private checkLastParamBase(
    parameters: readonly ts.Symbol[],
    checkParamType: (decl: ts.Node, type: ts.Type) => boolean,
  ): boolean {
    if (parameters.length === 0) {
      return false;
    }

    const lastParam = parameters[parameters.length - 1];
    const lastParamType = this.getParamSymbolType(lastParam);

    return lastParamType !== undefined && checkParamType(tsUtils.symbol.getDeclarations(lastParam)[0], lastParamType);
  }

  private getParamSymbolType(param: ts.Symbol): ts.Type | undefined {
    const decls = tsUtils.symbol.getDeclarations(param);
    const decl = utils.nullthrows(decls[0]);

    return this.context.analysis.getTypeOfSymbol(param, decl);
  }

  private toABIParameter(
    nameIn: string,
    node: ts.Node,
    resolvedTypeIn: ts.Type | undefined,
    optional = false,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ABIParameter | undefined {
    const name = nameIn.startsWith('_') ? nameIn.slice(1) : nameIn;
    let resolvedType = resolvedTypeIn;
    if (ts.isParameter(node) && tsUtils.parameter.isRestParameter(node) && resolvedType !== undefined) {
      resolvedType = tsUtils.type_.getTypeArgumentsArray(resolvedType)[0];
    }

    const type = toABIReturn(this.context, node, resolvedType, optional, options);
    if (type === undefined) {
      return undefined;
    }

    if (ts.isParameter(node) && tsUtils.parameter.isRestParameter(node)) {
      return { ...type, name, rest: true };
    }

    return { ...type, name };
  }

  private toABIReturn(
    node: ts.Node,
    resolvedType: ts.Type | undefined,
    optional = false,
    options: DiagnosticOptions = DEFAULT_DIAGNOSTIC_OPTIONS,
  ): ABIReturn {
    const type = toABIReturn(this.context, node, resolvedType, optional, options);

    return type === undefined ? VOID_RETURN : type;
  }
}
