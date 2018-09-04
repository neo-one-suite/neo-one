import { ABI, ABIEvent, ABIFunction, ABIParameter, ABIReturn, SenderAddressABIDefault } from '@neo-one/client';
import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import ts from 'typescript';
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

  private processFunctions(): ReadonlyArray<ABIFunction> {
    const deployInfo = this.findDeployInfo();
    const propInfos = this.contractInfo.propInfos
      .filter((propInfo) => propInfo.isPublic && propInfo.type !== 'deploy')
      .concat([deployInfo].filter(utils.notNull));

    return _.flatMap(
      propInfos.map((propInfo) => {
        switch (propInfo.type) {
          case 'deploy':
            return [
              {
                name: propInfo.name,
                parameters: this.getParameters(propInfo.callSignature),
                verify: propInfo.verify,
                returnType: BOOLEAN_RETURN,
              },
            ];
          case 'function':
            return [
              {
                name: propInfo.name,
                parameters: this.getParameters(propInfo.callSignature),
                verify: propInfo.verify,
                returnType: this.toABIReturn(propInfo.decl, propInfo.returnType),
                constant: propInfo.constant,
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
                    parameters: [this.toABIParameter(propInfo.name, propInfo.decl, propInfo.propertyType)],
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
                      ),
                    ],
                    returnType: VOID_RETURN,
                  },
            ].filter(utils.notNull);
          default:
            utils.assertNever(propInfo);
            throw new Error('For TS');
        }
      }),
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

  private getParameters(callSignature: ts.Signature | undefined): ReadonlyArray<ABIParameter> {
    if (callSignature === undefined) {
      return [];
    }

    return callSignature
      .getParameters()
      .map((parameter) => this.paramToABIParameter(parameter))
      .filter(utils.notNull);
  }

  private processEvents(): ReadonlyArray<ABIEvent> {
    const decl = tsUtils.symbol.getDeclarations(this.context.builtins.getValueSymbol('createEventNotifier'))[0];

    const calls = tsUtils.reference
      .findReferencesAsNodes(this.context.program, this.context.languageService, decl)
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

    return calls.map((call) => this.toABIEvent(call)).filter(utils.notNull);
  }

  private toABIEvent(call: ts.CallExpression): ABIEvent | undefined {
    const callArguments = tsUtils.argumented.getArguments(call);
    const typeArguments = tsUtils.argumented.getTypeArguments(call);
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
    const parameters = _.zip(callArguments.slice(1), typeArguments === undefined ? [] : typeArguments)
      .map(([paramNameArg, paramTypeNode]) => {
        if (paramNameArg === undefined || paramTypeNode === undefined) {
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

        return this.toABIParameter(paramName, paramTypeNode, this.context.analysis.getType(paramTypeNode));
      })
      .filter(utils.notNull);

    return { name, parameters };
  }

  private paramToABIParameter(param: ts.Symbol): ABIParameter | undefined {
    const decls = tsUtils.symbol.getDeclarations(param);
    const decl = utils.nullthrows(decls[0]);

    const initializer = tsUtils.initializer.getInitializer(decl);
    const parameter = this.toABIParameter(
      tsUtils.symbol.getName(param),
      decl,
      this.context.analysis.getTypeOfSymbol(param, decl),
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

  private toABIParameter(
    name: string,
    node: ts.Node,
    resolvedType: ts.Type | undefined,
    optional = false,
  ): ABIParameter | undefined {
    const type = this.toABIReturn(node, resolvedType, optional);
    if (type === undefined) {
      return undefined;
    }

    return { ...type, name };
  }

  private toABIReturn(node: ts.Node, resolvedType: ts.Type | undefined, optional = false): ABIReturn | undefined {
    return toABIReturn(this.context, node, resolvedType, optional);
  }
}
