import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import ts from 'typescript';
import { AccessorPropInfo, ContractInfo, DeployPropInfo, FunctionPropInfo, PropertyPropInfo } from '../../../contract';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { Case } from '../statement';

export interface InvokeSmartContractHelperOptions {
  readonly contractInfo: ContractInfo;
}

// Input: []
// Output: []
export class InvokeSmartContractHelper extends Helper {
  private readonly contractInfo: ContractInfo;

  public constructor({ contractInfo }: InvokeSmartContractHelperOptions) {
    super();
    this.contractInfo = contractInfo;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const findSuperDeployPropInfo = (contractInfo: ContractInfo): [ContractInfo, DeployPropInfo] | undefined => {
      const superSmartContract = contractInfo.superSmartContract;
      if (superSmartContract === undefined) {
        return undefined;
      }

      const superDeployPropInfo = superSmartContract.propInfos.find(
        (propInfo): propInfo is DeployPropInfo => propInfo.type === 'deploy',
      );
      if (superDeployPropInfo !== undefined) {
        return [superSmartContract, superDeployPropInfo];
      }

      return findSuperDeployPropInfo(superSmartContract);
    };

    const findDeployInfo = (): [ContractInfo, DeployPropInfo] | undefined => {
      const deployInfo = this.contractInfo.propInfos.find(
        (propInfo): propInfo is DeployPropInfo => propInfo.type === 'deploy',
      );

      return deployInfo === undefined ? findSuperDeployPropInfo(this.contractInfo) : [this.contractInfo, deployInfo];
    };

    const getCaseBase = (decl: ts.Node, name: string, whenTrue: () => void) => ({
      condition: () => {
        // [arg, arg]
        sb.emitOp(decl, 'DUP');
        // [string, arg, arg]
        sb.emitPushString(decl, name);
        // [boolean, arg]
        sb.emitOp(decl, 'EQUAL');
      },
      whenTrue: () => {
        // []
        sb.emitOp(decl, 'DROP');
        whenTrue();
      },
    });

    const getFunctionLikeCase = (
      name: string,
      decl: ts.SetAccessorDeclaration | ts.MethodDeclaration | ts.GetAccessorDeclaration,
      returnType?: ts.Type,
    ) =>
      getCaseBase(decl, name, () => {
        // [number]
        sb.emitPushInt(decl, 1);
        // [arg]
        sb.emitHelper(decl, options, sb.helpers.getArgument);
        sb.withScope(decl, options, (innerOptions) => {
          sb.emitHelper(
            decl,
            innerOptions,
            sb.helpers.parameters({
              params: tsUtils.parametered.getParameters(decl),
              mapParam: (param, innerInnerOptions) => {
                sb.emitHelper(
                  decl,
                  innerInnerOptions,
                  sb.helpers.wrapValRecursive({
                    type: sb.context.analysis.getType(param),
                    checkValue: true,
                    optional: tsUtils.initializer.getInitializer(param) !== undefined,
                  }),
                );
              },
            }),
          );

          let invokeOptions = innerOptions;
          if (ts.isSetAccessor(decl)) {
            invokeOptions = sb.noPushValueOptions(innerOptions);
          }

          sb.emitHelper(decl, invokeOptions, sb.helpers.invokeSmartContractMethod({ method: decl }));
          if (ts.isSetAccessor(decl)) {
            sb.emitPushBuffer(decl, Buffer.alloc(0, 0));
          } else {
            sb.emitHelper(decl, innerOptions, sb.helpers.unwrapValRecursive({ type: returnType }));
          }
        });
      });

    const getFunctionCase = (propInfo: FunctionPropInfo) =>
      getFunctionLikeCase(propInfo.name, propInfo.decl, propInfo.returnType);

    const handleDeployProperties = (contractInfo: ContractInfo, innerOptions: VisitOptions) => {
      contractInfo.propInfos
        .filter((prop) => prop.classDecl === contractInfo.smartContract)
        .forEach((propertyPropInfo) => {
          if (propertyPropInfo.type === 'property' && propertyPropInfo.structuredStorageType === undefined) {
            const property = propertyPropInfo.decl;
            if (ts.isPropertyDeclaration(property)) {
              const initializer = tsUtils.initializer.getInitializer(property);
              if (initializer !== undefined) {
                // [val]
                sb.visit(initializer, sb.pushValueOptions(innerOptions));
                // [name, val]
                sb.emitPushString(property, tsUtils.node.getName(property));
                // []
                sb.emitHelper(property, innerOptions, sb.helpers.putCommonStorage);
              }
            } else if (ts.isParameterPropertyDeclaration(property)) {
              const name = tsUtils.node.getName(property);
              // [val]
              sb.scope.get(sb, property, sb.pushValueOptions(innerOptions), name);
              // [name, val]
              sb.emitPushString(property, name);
              // []
              sb.emitHelper(property, innerOptions, sb.helpers.putCommonStorage);
            }
          }
        });
    };

    const handleDeploy = (
      currentContractInfo: ContractInfo,
      propInfo: DeployPropInfo,
      innerOptions: VisitOptions,
      entry = true,
    ) => {
      const decl = propInfo.decl;
      const superDeploy = findSuperDeployPropInfo(currentContractInfo);

      if (decl === undefined) {
        if (superDeploy === undefined) {
          handleDeployProperties(currentContractInfo, innerOptions);
        } else {
          handleDeploy(superDeploy[0], superDeploy[1], innerOptions, entry);
          handleDeployProperties(currentContractInfo, innerOptions);
        }
      } else {
        if (entry) {
          // [number]
          sb.emitPushInt(decl, 1);
          // [arg]
          sb.emitHelper(decl, innerOptions, sb.helpers.getArgument);
        }
        sb.withScope(decl, innerOptions, (innerInnerOptions) => {
          sb.emitHelper(
            decl,
            innerInnerOptions,
            sb.helpers.parameters({
              params: tsUtils.parametered.getParameters(decl),
              mapParam: (param, innerInnerInnerOptions) => {
                if (entry) {
                  sb.emitHelper(
                    decl,
                    innerInnerInnerOptions,
                    sb.helpers.wrapValRecursive({
                      type: sb.context.analysis.getType(param),
                      checkValue: true,
                      optional: tsUtils.initializer.getInitializer(param) !== undefined,
                    }),
                  );
                }
              },
            }),
          );

          const invokeOptions = sb.handleSuperConstructOptions(
            sb.noPushValueOptions(innerInnerOptions),
            (expr, _superExpr, innerInnerInnerOptions) => {
              if (superDeploy === undefined) {
                return;
              }

              // [argsarr]
              sb.emitHelper(expr, innerInnerInnerOptions, sb.helpers.args);
              handleDeploy(superDeploy[0], superDeploy[1], innerInnerInnerOptions, false);
              handleDeployProperties(currentContractInfo, innerInnerInnerOptions);
            },
          );
          if (superDeploy === undefined) {
            handleDeployProperties(currentContractInfo, innerInnerOptions);
          }
          sb.emitHelper(decl, invokeOptions, sb.helpers.invokeSmartContractMethod({ method: decl }));
        });
      }
    };

    const getDeployCase = (contractInfo: ContractInfo, propInfo: DeployPropInfo) => {
      const decl = propInfo.decl === undefined ? propInfo.classDecl : propInfo.decl;

      return getCaseBase(decl, propInfo.name, () => {
        handleDeploy(contractInfo, propInfo, options);
        sb.emitPushBoolean(decl, true);
      });
    };

    const getPropertyCase = (propInfo: PropertyPropInfo) => {
      const decl = propInfo.decl;

      return getCaseBase(decl, propInfo.name, () => {
        sb.emitPushString(decl, propInfo.name);
        sb.emitHelper(decl, options, sb.helpers.getCommonStorage);
        sb.emitHelper(decl, options, sb.helpers.unwrapValRecursive({ type: sb.context.analysis.getType(decl) }));
      });
    };

    const getAccessorCase = (propInfo: AccessorPropInfo) => {
      const mutableCases: Case[] = [];
      const getter = propInfo.getter;

      if (getter !== undefined) {
        mutableCases.push(getFunctionLikeCase(getter.name, getter.decl, propInfo.propertyType));
      }

      const setter = propInfo.setter;
      if (setter !== undefined) {
        mutableCases.push(getFunctionLikeCase(setter.name, setter.decl, propInfo.propertyType));
      }

      return mutableCases;
    };

    let cases = _.flatMap(
      this.contractInfo.propInfos
        .filter((propInfo) => propInfo.isPublic && propInfo.type !== 'deploy')
        .map((propInfo) => {
          if (propInfo.type === 'function') {
            return [getFunctionCase(propInfo)];
          }

          if (propInfo.type === 'property') {
            return [getPropertyCase(propInfo)];
          }

          if (propInfo.type === 'accessor') {
            return getAccessorCase(propInfo);
          }

          if (propInfo.type === 'deploy') {
            throw new Error('For TS');
          }

          /* istanbul ignore next */
          utils.assertNever(propInfo);
          /* istanbul ignore next */
          throw new Error('For TS');
        }),
    );
    const deploy = findDeployInfo();
    if (deploy !== undefined) {
      cases = cases.concat(getDeployCase(deploy[0], deploy[1]));
    }

    // [number]
    sb.emitSysCall(node, 'Neo.Runtime.GetTrigger');
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [number, number]
          sb.emitOp(node, 'DUP');
          // [number, number, number]
          sb.emitPushInt(node, 0x10);
          // [boolean, number]
          sb.emitOp(node, 'NUMEQUAL');
        },
        whenTrue: () => {
          // []
          sb.emitOp(node, 'DROP');
          // [number]
          sb.emitPushInt(node, 0);
          // [arg]
          sb.emitHelper(node, options, sb.helpers.getArgument);
          sb.emitHelper(
            node,
            options,
            sb.helpers.case(cases, () => {
              sb.emitOp(node, 'DROP');
              sb.emitOp(node, 'THROW');
            }),
          );
        },
      }),
    );
  }
}
