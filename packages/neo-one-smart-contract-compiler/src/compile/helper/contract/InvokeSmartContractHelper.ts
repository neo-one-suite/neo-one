// tslint:disable prefer-switch
import { TransactionTypeModel as TransactionType } from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import ts from 'typescript';
import { ContractPropertyName } from '../../../constants';
import {
  AccessorPropInfo,
  CompleteSendPropInfo,
  ContractInfo,
  DeployPropInfo,
  FunctionPropInfo,
  PropertyPropInfo,
  RefundAssetsPropInfo,
  UpgradePropInfo,
} from '../../../contract';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { Case } from '../statement';
import { findDeployInfo } from './utils';

export interface InvokeSmartContractHelperOptions {
  readonly contractInfo: ContractInfo;
}

/**
 * Pseudocode of what's happening here:
 * const contract = new Contract();
 *
 * const handleSend = () => {
 *  if (isProcessed(Blockchain.currentTransaction.hash)) {
 *    return false;
 *  }
 *
 *  if (!firstOutputToSelf()) {
 *    return false;
 *  }
 *
 *  if (!allInputsAreProcessedAndUnclaimed()) {
 *    return false;
 *  }
 *
 *  if (!netZero()) {
 *    return false;
 *  }
 *
 *  const args = getArgument(1);
 *  const { asset, amount } = getSendArgs();
 *  const result = contract.sendMethod(...args, asset, amount);
 *  if (result) {
 *    markProcessed(Blockchain.currentTransaction.hash);
 *    markClaimed(Blockchain.currentTransaction.hash, receiver);
 *  }
 *  return result;
 * }
 *
 * // Completing a pending send fully consumes the first output of claimed transaction(s).
 * // No additional tracking required since outputs can only be used once.
 * const completeSend = () => {
 *  const hash = getSentAssetsTransactionHash();
 *  if (hash === undefined) {
 *    return false;
 *  }
 *
 *  const receiver = getClaimed(hash);
 *  if (receiver === undefined) {
 *    return false;
 *  }
 *
 *  if (!Address.isCaller(receiver)) {
 *    return false;
 *  }
 *
 *  if (anyOtherReferenceFromContract()) {
 *    return false;
 *  }
 *
 *  return true;
 * }
 *
 * const handleSendUnsafe = () => {
 *  if (isProcessed(Blockchain.currentTransaction.hash)) {
 *    return false;
 *  }
 *
 *  if (!isReceiveMethod() && !onlySentAssets()) {
 *    return false;
 *  }
 *
 *  const args = getArgument(1);
 *  const result = contract.sendUnsafeMethod(...args);
 *  if (result) {
 *    markProcessed(Blockchain.currentTransaction.hash);
 *  }
 *  return result;
 * }
 *
 * const handleReceive = () => {
 *  if (isProcessed(Blockchain.currentTransaction.hash)) {
 *    return false;
 *  }
 *
 *  if (!isSendUnsafeMethod() && !onlyReceivedAssets()) {
 *    return false;
 *  }
 *
 *  const args = getArgument(1);
 *  const result = contract.receiveMethod(...args);
 *  if (result) {
 *    markProcessed(Blockchain.currentTransaction.hash);
 *  }
 *  return result;
 * }
 *
 * // Refunds fully consume the outputs of an unprocessed transaction, which means
 * // we don't have to do any additional tracking since outputs can only be used once.
 * const handleRefund = () => {
 *  const hash = getSentAssetsTransactionHash();
 *  if (hash === undefined) {
 *    return false;
 *  }
 *
 *  if (isProcessed(hash)) {
 *    return false;
 *  }
 *
 *  if (!getTransactionReferences(hash).every((output) => Address.isCaller(output.scriptHash))) {
 *    return false;
 *  }
 *
 *  return true;
 * }
 *
 * const handleNormal = () => {
 *  const args = getArgument(1);
 *  return contract.normalMethod(...args);
 * }
 *
 * const handleUpgrade = () => {
 *  if (contract.approveUpgrade()) {
 *    const args = getArgument(1);
 *    Neo.Contract.Migrate(...args);
 *    return true;
 *  }
 *  return false;
 * }
 *
 * const handleDeploy = () => {
 *  if (isDeployed()) {
 *    return false;
 *  }
 *
 *  contract.deploy(...getArgument(1));
 *  setDeployed(true);
 *  return true;
 * }
 *
 * const handleClaim = () => {
 *  return contract.claimMethod(...getArgument(1), System.ExecutionEnginer.GetScriptContainer());
 * }
 *
 * const trigger = Neo.Runtime.GetTrigger()
 * if (trigger === TriggerType.Application) {
 *  const method = getArgument(0);
 *  switch (method) {
 *    case 'normalMethod':
 *      return handleNormalMethod();
 *    case 'sendMethod':
 *      return handleSend();
 *    case 'sendUnsafeMethod':
 *      return handleSendUnsafe();
 *    case 'receiveMethod':
 *      return handleReceive();
 *    case 'upgrade':
 *      return handleUpgrade();
 *    case 'refundAssets':
 *      return handleRefund();
 *    case 'completeSend':
 *      return handleCompleteSend();
 *    case 'deploy':
 *      return handleDeploy();
 *    default:
 *      throw new Error('Unknown method');
 * } else if (trigger === TriggerType.Verification) {
 *  const transaction = System.ExecutionEnginer.GetScriptContainer();
 *  if (transaction.type === TransactionType.Invocation) {
 *    const method = getArgument(0);
 *    switch (method) {
 *      case 'sendMethod':
 *        if (!applicationScriptMatchesVerification()) {
 *          return false;
 *        }
 *        return handleSend();
 *      case 'sendUnsafeMethod':
 *        if (!applicationScriptMatchesVerification()) {
 *          return false;
 *        }
 *        return handleSendUnsafe();
 *      case 'receiveMethod':
 *        if (!applicationScriptMatchesVerification()) {
 *          return false;
 *        }
 *        return handleReceive();
 *      case 'completeSend':
 *        return handleCompleteSend();
 *      default:
 *        if (didSendAssets() || didReceiveAssets()) {
 *          throw new Error();
 *        }
 *        return handleOther();
 *    }
 *  } else if (transaction.type === TransactionType.Claim) {
 *    if (didSendAssets() || didReceiveNonClaimAssets()) {
 *      return false;
 *    }
 *    const method = getArgument(0);
 *    switch (method) {
 *      case 'claimMethod':
 *        return handleClaim();
 *      default:
 *        throw new Error();
 *    } else {
 *      throw new Error();
 *    }
 *  } else {
 *    throw new Error();
 *  }
 * }
 *
 */

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

    const getFunctionCase = (propInfo: FunctionPropInfo) =>
      getCaseBase(propInfo.decl, propInfo.name, () => {
        const decl = propInfo.decl;
        if (ts.isPropertyDeclaration(decl)) {
          sb.context.reportUnsupported(decl);

          return;
        }

        if (propInfo.send) {
          sb.emitHelper(decl, options, sb.helpers.handleSend({ method: decl }));
        } else if (propInfo.receive) {
          sb.emitHelper(decl, options, sb.helpers.handleReceive({ opposite: propInfo.sendUnsafe, method: decl }));
        } else if (propInfo.sendUnsafe) {
          sb.emitHelper(decl, options, sb.helpers.handleSendUnsafe({ opposite: propInfo.receive, method: decl }));
        } else {
          sb.emitHelper(decl, options, sb.helpers.handleNormal({ propInfo }));
        }
      });

    const getDeployCase = (contractInfo: ContractInfo, propInfo: DeployPropInfo) => {
      const decl = propInfo.decl === undefined ? propInfo.classDecl : propInfo.decl;

      return getCaseBase(decl, propInfo.name, () => {
        sb.emitHelper(decl, options, sb.helpers.deploy({ contractInfo, propInfo }));
      });
    };

    const getPropertyCase = (propInfo: PropertyPropInfo) => {
      const decl = propInfo.decl;

      return getCaseBase(decl, propInfo.name, () => {
        sb.emitHelper(decl, options, sb.helpers.handleNormal({ propInfo }));
      });
    };

    const getAccessorCase = (propInfo: AccessorPropInfo) => {
      const mutableCases: Case[] = [];
      const getter = propInfo.getter;

      if (getter !== undefined) {
        mutableCases.push(
          getCaseBase(getter.decl, getter.name, () => {
            sb.emitHelper(getter.decl, options, sb.helpers.handleNormal({ propInfo, getter: true }));
          }),
        );
      }

      const setter = propInfo.setter;
      if (setter !== undefined) {
        mutableCases.push(
          getCaseBase(setter.decl, setter.name, () => {
            sb.emitHelper(setter.decl, options, sb.helpers.handleNormal({ propInfo, getter: false }));
          }),
        );
      }

      return mutableCases;
    };

    const getRefundAssetsCase = (propInfo: RefundAssetsPropInfo) =>
      getCaseBase(node, ContractPropertyName.refundAssets, () => {
        sb.emitHelper(node, options, sb.helpers.handleNormal({ propInfo }));
      });

    const getCompleteSendCase = (propInfo: CompleteSendPropInfo) =>
      getCaseBase(node, ContractPropertyName.completeSend, () => {
        sb.emitHelper(node, options, sb.helpers.handleNormal({ propInfo }));
      });

    const getUpgradeCase = (propInfo: UpgradePropInfo) =>
      getCaseBase(node, ContractPropertyName.upgrade, () => {
        sb.emitHelper(node, options, sb.helpers.handleNormal({ propInfo }));
      });

    const allCases = _.flatten(
      this.contractInfo.propInfos
        .filter((propInfo) => propInfo.isPublic && propInfo.type !== 'deploy')
        .map((propInfo) => {
          if (propInfo.type === 'function') {
            return [
              {
                propCase: getFunctionCase(propInfo),
                claimVerify: propInfo.claim,
                invokeVerify: propInfo.send || propInfo.sendUnsafe || propInfo.receive,
              },
            ];
          }

          if (propInfo.type === 'refundAssets') {
            return [{ propCase: getRefundAssetsCase(propInfo), claimVerify: false, invokeVerify: true }];
          }

          if (propInfo.type === 'completeSend') {
            return [{ propCase: getCompleteSendCase(propInfo), claimVerify: false, invokeVerify: true }];
          }

          if (propInfo.type === 'property') {
            return [{ propCase: getPropertyCase(propInfo), claimVerify: false, invokeVerify: false }];
          }

          if (propInfo.type === 'accessor') {
            return getAccessorCase(propInfo).map((propCase) => ({
              propCase,
              claimVerify: false,
              invokeVerify: false,
            }));
          }

          if (propInfo.type === 'upgrade') {
            return [{ propCase: getUpgradeCase(propInfo), claimVerify: false, invokeVerify: false }];
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
    let applicationCases = allCases.filter((propCase) => !propCase.claimVerify).map(({ propCase }) => propCase);
    const deploy = findDeployInfo(this.contractInfo);
    if (deploy !== undefined) {
      applicationCases = applicationCases.concat(getDeployCase(deploy[0], deploy[1]));
    }
    const invocationVerifyCases = allCases.filter((propCase) => propCase.invokeVerify).map(({ propCase }) => propCase);
    const nonVerifyCases = allCases.filter((propCase) => !propCase.invokeVerify).map(({ propCase }) => propCase);
    const claimCases = allCases.filter((propCase) => propCase.claimVerify).map(({ propCase }) => propCase);

    const throwDefault = () => {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'THROW');
    };

    const handleInvokeVerify = (func: () => void) => {
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            sb.emitHelper(node, options, sb.helpers.applicationMatchesVerification);
          },
          whenTrue: () => {
            func();
          },
          whenFalse: () => {
            // []
            sb.emitOp(node, 'DROP');
            sb.emitPushBoolean(node, false);
          },
        }),
      );
    };

    const handleDefaultInvokeVerify = () => {
      // []
      sb.emitOp(node, 'DROP');
      // [boolean]
      sb.emitHelper(node, options, sb.helpers.didReceiveAssets);
      // [boolean, boolean]
      sb.emitHelper(node, options, sb.helpers.didSendAssets);
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [boolean]
            sb.emitOp(node, 'BOOLOR');
          },
          whenTrue: () => {
            sb.emitOp(node, 'THROW');
          },
          whenFalse: () => {
            // [number]
            sb.emitPushInt(node, 0);
            // [arg]
            sb.emitHelper(node, options, sb.helpers.getArgument);
            sb.emitHelper(node, options, sb.helpers.case(nonVerifyCases, throwDefault));
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
              sb.emitHelper(node, options, sb.helpers.case(applicationCases, throwDefault));
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
                            invocationVerifyCases.map((propCase) => ({
                              ...propCase,
                              whenTrue: () => {
                                handleInvokeVerify(propCase.whenTrue);
                              },
                            })),
                            handleDefaultInvokeVerify,
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
                        // [boolean]
                        sb.emitHelper(node, options, sb.helpers.didReceiveNonClaimAssets);
                        // [boolean, boolean]
                        sb.emitHelper(node, options, sb.helpers.didSendAssets);
                        sb.emitHelper(
                          node,
                          options,
                          sb.helpers.if({
                            condition: () => {
                              // [boolean]
                              sb.emitOp(node, 'BOOLOR');
                            },
                            whenTrue: () => {
                              sb.emitPushBoolean(node, false);
                            },
                            whenFalse: () => {
                              // [number]
                              sb.emitPushInt(node, 0);
                              // [arg]
                              sb.emitHelper(node, options, sb.helpers.getArgument);
                              sb.emitHelper(node, options, sb.helpers.case(claimCases, throwDefault));
                            },
                          }),
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
