// tslint:disable prefer-switch
import { Op, TransactionType } from '@neo-one/client-core';
import { tsUtils } from '@neo-one/ts-utils';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import ts from 'typescript';
import { ContractPropertyName } from '../../../constants';
import { AccessorPropInfo, ContractInfo, DeployPropInfo, FunctionPropInfo, PropertyPropInfo } from '../../../contract';
import { Types } from '../../constants';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { Case } from '../statement';

export interface InvokeSmartContractHelperOptions {
  readonly contractInfo: ContractInfo;
}

enum Trigger {
  application = 'application',
  verification = 'verification',
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

    const getCaseBase = (decl: ts.Node, name: string, whenTrue: (trigger: Trigger) => void) => (trigger: Trigger) => ({
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
        whenTrue(trigger);
      },
    });

    const getFunctionLikeCase = (
      name: string,
      decl: ts.SetAccessorDeclaration | ts.MethodDeclaration | ts.GetAccessorDeclaration,
      returnType?: ts.Type,
      acceptsClaim?: boolean,
      prelude?: (rest: () => void) => (trigger: Trigger) => void,
    ) => {
      const handleCase = () => {
        // [number]
        sb.emitPushInt(decl, 1);
        // [arg]
        sb.emitHelper(decl, options, sb.helpers.getArgument);
        if (acceptsClaim) {
          // [arg, arg]
          sb.emitOp(decl, 'DUP');
          // [transaction, arg, arg]
          sb.emitSysCall(decl, 'System.ExecutionEngine.GetScriptContainer');
          // [transactionVal, arg, arg]
          sb.emitHelper(decl, options, sb.helpers.wrapTransaction);
          // [arg]
          sb.emitOp(decl, 'APPEND');
        }
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
      };

      return getCaseBase(decl, name, prelude === undefined ? handleCase : prelude(handleCase));
    };

    const getFunctionCase = (propInfo: FunctionPropInfo) =>
      getFunctionLikeCase(
        propInfo.name,
        propInfo.decl,
        propInfo.returnType,
        propInfo.acceptsClaim,
        (rest) => (trigger) => {
          const decl = propInfo.decl;
          // Check and store that we've already processed this transaction
          if (trigger === Trigger.application && (propInfo.send || propInfo.receive)) {
            // [val]
            sb.emitHelper(
              decl,
              options,
              sb.helpers.createStructuredStorage({
                prefix: ContractPropertyName.processedTransactions,
                type: Types.SetStorage,
              }),
            );
            // [val, val]
            sb.emitOp(decl, 'DUP');
            // [transaction, val, val]
            sb.emitSysCall(decl, 'System.ExecutionEngine.GetScriptContainer');
            // [hash, val, val]
            sb.emitSysCall(decl, 'Neo.Transaction.GetHash');
            // [hashVal, val, val]
            sb.emitHelper(decl, options, sb.helpers.wrapBuffer);
            // [hashVal, val, hashVal, val]
            sb.emitOp(decl, 'TUCK');
            // [val, hashVal, val]
            sb.emitHelper(
              decl,
              options,
              sb.helpers.hasStructuredStorage({
                type: Types.SetStorage,
                keyType: undefined,
                knownKeyType: Types.Buffer,
              }),
            );
            sb.emitHelper(
              node,
              options,
              sb.helpers.if({
                condition: () => {
                  // [boolean]
                  sb.emitHelper(node, options, sb.helpers.unwrapBoolean);
                },
                whenTrue: () => {
                  // [val]
                  sb.emitOp(node, 'DROP');
                  // []
                  sb.emitOp(node, 'DROP');
                  // [boolean]
                  sb.emitPushBoolean(node, false);
                },
                whenFalse: () => {
                  // [boolean, hashVal, val]
                  sb.emitPushBoolean(node, true);
                  // [booleanVal, hashVal, val]
                  sb.emitHelper(node, options, sb.helpers.wrapBoolean);
                  // []
                  sb.emitHelper(
                    node,
                    options,
                    sb.helpers.setStructuredStorage({
                      type: Types.MapStorage,
                      keyType: undefined,
                      knownKeyType: Types.Buffer,
                    }),
                  );
                  // [boolean]
                  rest();
                },
              }),
            );

            return;
          }

          // Check that the verification script is the same as the application script
          if (trigger === Trigger.verification && (propInfo.send || propInfo.receive)) {
            // [transaction]
            sb.emitSysCall(decl, 'System.ExecutionEngine.GetScriptContainer');
            // [buffer]
            sb.emitSysCall(decl, 'Neo.InvocationTransaction.GetScript');
            // [buffer, buffer]
            sb.emitOp(decl, 'DUP');
            // [21, buffer, buffer]
            sb.emitPushInt(decl, 21);
            // [21, buffer, 21, buffer]
            sb.emitOp(decl, 'TUCK');
            // [appCallHash, 21, buffer]
            sb.emitOp(decl, 'RIGHT');
            // [appCall, appCallHash, 21, buffer]
            sb.emitPushBuffer(decl, Buffer.from([Op.APPCALL]));
            // [hash, appCall, appCallHash, 21, buffer]
            sb.emitSysCall(decl, 'System.ExecutionEngine.GetExecutingScriptHash');
            // [appCallHash, appCallHash, 21, buffer]
            sb.emitOp(decl, 'CAT');
            sb.emitHelper(
              decl,
              options,
              sb.helpers.if({
                condition: () => {
                  // [boolean, 21, buffer]
                  sb.emitOp(decl, 'EQUAL');
                },
                whenTrue: () => {
                  // [buffer, 21, buffer]
                  sb.emitOp(decl, 'OVER');
                  // [size, 21, buffer]
                  sb.emitOp(decl, 'SIZE');
                  // [21, size, buffer]
                  sb.emitOp(decl, 'SWAP');
                  // [size - 21, buffer]
                  sb.emitOp(decl, 'SUB');
                  // [argsBuffer]
                  sb.emitOp(decl, 'LEFT');
                  // [argsHash]
                  sb.emitOp(decl, 'HASH160');
                  // [entryHash, argsHash]
                  sb.emitSysCall(decl, 'System.ExecutionEngine.GetEntryScriptHash');
                  sb.emitHelper(
                    decl,
                    options,
                    sb.helpers.if({
                      condition: () => {
                        // [boolean]
                        sb.emitOp(decl, 'EQUAL');
                      },
                      whenTrue: () => {
                        // [boolean]
                        rest();
                      },
                      whenFalse: () => {
                        // [boolean]
                        sb.emitPushBoolean(decl, false);
                      },
                    }),
                  );
                },
                whenFalse: () => {
                  // [buffer]
                  sb.emitOp(decl, 'DROP');
                  // []
                  sb.emitOp(decl, 'DROP');
                  // [boolean]
                  sb.emitPushBoolean(decl, false);
                },
              }),
            );

            return;
          }

          // [boolean]
          rest();
        },
      );

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
      const mutableCases: Array<(trigger: Trigger) => Case> = [];
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

    const allCases = _.flatMap(
      this.contractInfo.propInfos
        .filter((propInfo) => propInfo.isPublic && propInfo.type !== 'deploy')
        .map((propInfo) => {
          if (propInfo.type === 'function') {
            return [
              {
                propCase: getFunctionCase(propInfo),
                claim: propInfo.claim,
                send: propInfo.send,
                receive: propInfo.receive,
              },
            ];
          }

          if (propInfo.type === 'property') {
            return [{ propCase: getPropertyCase(propInfo), claim: false, send: false, receive: false }];
          }

          if (propInfo.type === 'accessor') {
            return getAccessorCase(propInfo).map((propCase) => ({
              propCase,
              claim: false,
              send: false,
              receive: false,
            }));
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
    let applicationCases = allCases.filter((propCase) => !propCase.claim).map(({ propCase }) => propCase);
    const deploy = findDeployInfo();
    if (deploy !== undefined) {
      applicationCases = applicationCases.concat(getDeployCase(deploy[0], deploy[1]));
    }
    const invocationVerifyCases = allCases
      .filter((propCase) => propCase.receive || propCase.send)
      .map(({ propCase }) => propCase);
    const nonVerifyCases = allCases
      .filter((propCase) => !propCase.receive && !propCase.send && !propCase.claim)
      .map(({ propCase }) => propCase);
    const claimCases = allCases.filter((propCase) => propCase.claim).map(({ propCase }) => propCase);

    const throwDefault = () => {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'THROW');
    };

    const handleDefaultVerify = () => {
      // []
      sb.emitOp(node, 'DROP');
      // [transaction]
      sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
      // [references]
      sb.emitSysCall(node, 'Neo.Transaction.GetReferences');
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            sb.emitHelper(
              node,
              options,
              sb.helpers.arrSome({
                map: () => {
                  // [address]
                  sb.emitSysCall(node, 'Neo.Output.GetScriptHash');
                  // [address, address]
                  sb.emitSysCall(node, 'System.ExecutionEngine.GetExecutingScriptHash');
                  // [boolean]
                  sb.emitOp(node, 'EQUAL');
                },
              }),
            );
          },
          whenTrue: () => {
            sb.emitOp(node, 'THROW');
          },
          whenFalse: () => {
            // [transaction]
            sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
            // [outputs]
            sb.emitSysCall(node, 'Neo.Transaction.GetOutputs');
            sb.emitHelper(
              node,
              options,
              sb.helpers.if({
                condition: () => {
                  sb.emitHelper(
                    node,
                    options,
                    sb.helpers.arrSome({
                      map: () => {
                        // [address]
                        sb.emitSysCall(node, 'Neo.Output.GetScriptHash');
                        // [address, address]
                        sb.emitSysCall(node, 'System.ExecutionEngine.GetExecutingScriptHash');
                        // [boolean]
                        sb.emitOp(node, 'EQUAL');
                      },
                    }),
                  );
                },
                whenTrue: () => {
                  sb.emitOp(node, 'THROW');
                },
                whenFalse: () => {
                  // No inputs or outputs relevant to this contract, go ahead and run as if it's an application trigger.
                  // [number]
                  sb.emitPushInt(node, 0);
                  // [arg]
                  sb.emitHelper(node, options, sb.helpers.getArgument);
                  sb.emitHelper(
                    node,
                    options,
                    sb.helpers.case(nonVerifyCases.map((propCase) => propCase(Trigger.application)), throwDefault),
                  );
                },
              }),
            );
          },
        }),
      );
    };

    // [number]
    sb.emitSysCall(node, 'Neo.Runtime.GetTrigger');
    sb.emitHelper(
      node,
      options,
      sb.helpers.case(
        [
          {
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
              // []
              sb.emitHelper(
                node,
                options,
                sb.helpers.case(applicationCases.map((propCase) => propCase(Trigger.application)), throwDefault),
              );
            },
          },
          {
            condition: () => {
              // [number, number]
              sb.emitOp(node, 'DUP');
              // [number, number, number]
              sb.emitPushInt(node, 0x00);
              // [boolean, number]
              sb.emitOp(node, 'NUMEQUAL');
            },
            whenTrue: () => {
              // []
              sb.emitOp(node, 'DROP');
              // [transaction]
              sb.emitSysCall(node, 'System.ExecutionEngine.GetScriptContainer');
              // [type]
              sb.emitSysCall(node, 'Neo.Transaction.GetType');
              sb.emitHelper(
                node,
                options,
                sb.helpers.case(
                  [
                    {
                      condition: () => {
                        // [type, type]
                        sb.emitOp(node, 'DUP');
                        // [number, type, type]
                        sb.emitPushInt(node, TransactionType.Invocation);
                        // [boolean, type]
                        sb.emitOp(node, 'NUMEQUAL');
                      },
                      whenTrue: () => {
                        // []
                        sb.emitOp(node, 'DROP');
                        // [number]
                        sb.emitPushInt(node, 0);
                        // [arg]
                        sb.emitHelper(node, options, sb.helpers.getArgument);
                        // []
                        sb.emitHelper(
                          node,
                          options,
                          sb.helpers.case(
                            invocationVerifyCases.map((propCase) => propCase(Trigger.verification)),
                            handleDefaultVerify,
                          ),
                        );
                      },
                    },
                    {
                      condition: () => {
                        // [type, type]
                        sb.emitOp(node, 'DUP');
                        // [number, type, type]
                        sb.emitPushInt(node, TransactionType.Claim);
                        // [boolean, type]
                        sb.emitOp(node, 'NUMEQUAL');
                      },
                      whenTrue: () => {
                        // []
                        sb.emitOp(node, 'DROP');
                        // [number]
                        sb.emitPushInt(node, 0);
                        // [arg]
                        sb.emitHelper(node, options, sb.helpers.getArgument);
                        // []
                        sb.emitHelper(
                          node,
                          options,
                          sb.helpers.case(claimCases.map((propCase) => propCase(Trigger.verification)), throwDefault),
                        );
                      },
                    },
                  ],
                  throwDefault,
                ),
              );
            },
          },
        ],
        throwDefault,
      ),
    );
  }
}
