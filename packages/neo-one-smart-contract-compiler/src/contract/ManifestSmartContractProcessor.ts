import {
  ABIParameter,
  ABIReturn,
  ContractEventDescriptorClient,
  ContractGroup,
  ContractPermission,
  SenderAddressABIDefault,
  UInt160Hex,
  WildcardContainer,
} from '@neo-one/client-common';
import { NEO_ONE_METHOD_RESERVED_PARAM } from '@neo-one/client-core';
import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import ts from 'typescript';
import { DEFAULT_DIAGNOSTIC_OPTIONS, DiagnosticOptions } from '../analysis';
import {
  SmartContractInfoABI,
  SmartContractInfoManifest,
  SmartContractInfoMethodDescriptor,
} from '../compile/getSmartContractInfo';
import { ContractProperties } from '../constants';
import { Context } from '../Context';
import { DiagnosticCode } from '../DiagnosticCode';
import { DiagnosticMessage } from '../DiagnosticMessage';
import { getSetterName, toABIReturn } from '../utils';
import { ContractInfo, DeployPropInfo } from './ContractInfoProcessor';

const BOOLEAN_RETURN: ABIReturn = { type: 'Boolean' };
const VOID_RETURN: ABIReturn = { type: 'Void' };

export class ManifestSmartContractProcessor {
  public constructor(
    private readonly context: Context,
    private readonly contractInfo: ContractInfo,
    private readonly properties: ContractProperties,
  ) {}

  public process(): SmartContractInfoManifest {
    return {
      groups: this.processGroups(),
      supportedStandards: this.processSupportedStandards(),
      abi: this.processABI(),
      permissions: this.processPermissions(),
      trusts: this.processTrusts(),
    };
  }

  // TODO: document permissions, trusts, groups
  // "contract.Manifest" is the manifest of contract to be called = "ManifestCalled"
  // "currentManifest" is the manifest of the contract that is making the call = "CallingManifest"
  // "method" is the method being called
  // currentManifest.CanCall(contract.Manifest, method)
  // If any Permission.isAllowed(manifest, method) returns true
  // IsAllowed(manifest, method)
  // Now "manifest" is the manifest of the contract to be called
  // IsAllowed is for the Permission object in the manifest of the contract making the call
  // Permission.Contract = the contract to be invoked (a contract hash or a "group" which is a public key)
  // Permission.Methods = the methods to be called

  // If Permission.Contract is a hash, then check if Permission.Contract.Hash === ManifestCalled.Hash
  // in this case CanCall() will return true as long as the

  private processGroups(): readonly ContractGroup[] {
    return this.properties.groups;
  }

  private processPermissions(): readonly ContractPermission[] {
    return this.properties.permissions;
  }

  private processTrusts(): WildcardContainer<UInt160Hex> {
    return this.properties.trusts;
  }

  private processSupportedStandards(): readonly string[] {
    return [this.isNep17Contract() ? 'NEP-17' : undefined].filter(utils.notNull);
  }

  private isNep17Contract(): boolean {
    const propInfos = this.contractInfo.propInfos.filter((propInfo) => propInfo.isPublic && propInfo.type !== 'deploy');
    const hasTransferEvent = this.processEvents().some((event) => event.name === 'Transfer');
    const hasTotalSupply = propInfos.some(
      (info) =>
        info.name === 'totalSupply' &&
        ((info.type === 'function' && info.constant && info.isSafe) ||
          (info.type === 'accessor' && info.getter?.constant && info.getter?.isSafe)),
    );
    const hasBalanceOf = propInfos.some(
      (info) => info.type === 'function' && info.name === 'balanceOf' && info.constant && info.isSafe,
    );
    const hasTransfer = propInfos.some(
      (info) => info.type === 'function' && info.name === 'transfer' && !info.constant && !info.isSafe,
    );
    const hasDecimals = propInfos.some(
      (info) => info.type === 'property' && info.name === 'decimals' && info.isReadonly && info.isSafe,
    );
    const hasSymbol = propInfos.some(
      (info) => info.type === 'property' && info.name === 'symbol' && info.isReadonly && info.isSafe,
    );

    return hasTotalSupply && hasBalanceOf && hasTransfer && hasDecimals && hasSymbol && hasTransferEvent;
  }

  private processABI(): SmartContractInfoABI {
    return {
      // TODO: fix this later when changing how smart contracts are called
      methods: this.modifyProcessedFunctions(this.processFunctions()),
      events: this.processEvents(),
    };
  }

  // TODO: remove this later when changing how smart contracts are called
  private modifyProcessedFunctions(
    methods: ReadonlyArray<SmartContractInfoMethodDescriptor>,
  ): ReadonlyArray<SmartContractInfoMethodDescriptor> {
    return methods.map((method) =>
      method.parameters === undefined
        ? method
        : { ...method, parameters: this.addDefaultEntryParams(method.parameters) },
    );
  }

  // TODO: remove this later when changing how smart contracts are called
  private addDefaultEntryParams(params: readonly ABIParameter[]): readonly ABIParameter[] {
    return [
      {
        type: 'String',
        name: NEO_ONE_METHOD_RESERVED_PARAM,
      },
      ...params,
    ];
  }

  // TODO: make sure this matches up with docs and with @safe decorator
  // These methods are automatically safe:
  // Marked with @safe or @constant
  // Properties that are readonly or @safe
  // Getters marked with @constant or @safe
  // Not the deploy method
  private processFunctions(): ReadonlyArray<SmartContractInfoMethodDescriptor> {
    const deployInfo = this.findDeployInfo();
    const propInfos = this.contractInfo.propInfos
      .filter((propInfo) => propInfo.isPublic && propInfo.type !== 'deploy')
      .concat([deployInfo].filter(utils.notNull));

    return _.flatten<SmartContractInfoMethodDescriptor>(
      propInfos.map(
        (propInfo): ReadonlyArray<SmartContractInfoMethodDescriptor> => {
          switch (propInfo.type) {
            case 'deploy':
              return [
                {
                  name: propInfo.name,
                  parameters: propInfo.isMixinDeploy
                    ? []
                    : this.getParameters({ callSignature: propInfo.callSignature }),
                  returnType: BOOLEAN_RETURN,
                  safe: propInfo.isSafe,
                },
              ];
            case 'upgrade':
              return [
                {
                  name: propInfo.name,
                  parameters: [
                    { name: 'script', type: 'Buffer' },
                    { name: 'manifest', type: 'Buffer' },
                  ],
                  returnType: VOID_RETURN,
                  safe: propInfo.isSafe,
                },
              ];
            case 'function':
              return [
                {
                  name: propInfo.name,
                  parameters: this.getParameters({
                    callSignature: propInfo.callSignature,
                  }),
                  returnType: this.toABIReturn(propInfo.decl, propInfo.returnType),
                  constant: propInfo.constant,
                  safe: propInfo.isSafe,
                },
              ];
            case 'property':
              return [
                {
                  name: propInfo.name,
                  parameters: [],
                  returnType: this.toABIReturn(propInfo.decl, propInfo.propertyType),
                  constant: true,
                  safe: propInfo.isSafe,
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
                      safe: propInfo.isSafe,
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
                      safe: propInfo.getter.isSafe,
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
                      safe: propInfo.setter.isSafe,
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
  }: {
    readonly callSignature: ts.Signature | undefined;
    readonly send?: boolean;
  }): ReadonlyArray<ABIParameter> {
    if (callSignature === undefined) {
      return [];
    }

    const parameters = callSignature.getParameters();

    return parameters.map((parameter) => this.paramToABIParameter(parameter)).filter(utils.notNull);
  }

  private processEvents(): ReadonlyArray<ContractEventDescriptorClient> {
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

    return calls.reduce<ReadonlyArray<ContractEventDescriptorClient>>((events, call) => {
      const event = this.toContractEventDescriptorClient(call, events);

      return event === undefined ? events : [...events, event];
    }, []);
  }

  private toContractEventDescriptorClient(
    call: ts.CallExpression,
    events: ReadonlyArray<ContractEventDescriptorClient>,
  ): ContractEventDescriptorClient | undefined {
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
