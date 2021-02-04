// tslint:disable prefer-switch
import { TriggerType } from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import ts from 'typescript';
import { ContractPropertyName } from '../../../constants';
import {
  AccessorPropInfo,
  ContractInfo,
  DeployPropInfo,
  FunctionPropInfo,
  PropertyPropInfo,
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
 */

// TODO: args has changed. no longer array of properties, but a script and a serialized manifest
/**
 * const handleUpgrade = () => {
 *  if (contract.approveUpgrade()) {
 *    const args = getArgument(1);
 *    System.Contract.Update(...args);
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
 *    case 'upgrade':
 *      return handleUpgrade();
 *    case 'deploy':
 *      return handleDeploy();
 *    default:
 *      throw new Error('Unknown method');
 * } else if (trigger === TriggerType.Verification) {
 *   const method = getArgument(0);
 *   switch (method) {
 *     default:
 *       return handleOther();
 *   }
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
        sb.emitHelper(decl, options, sb.helpers.handleNormal({ propInfo }));
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

    // TODO: change arguments from properties array to script and serialized new manifest
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
                invokeVerify: false,
              },
            ];
          }

          if (propInfo.type === 'property') {
            return [{ propCase: getPropertyCase(propInfo), invokeVerify: false }];
          }

          if (propInfo.type === 'accessor') {
            return getAccessorCase(propInfo).map((propCase) => ({
              propCase,
              invokeVerify: false,
            }));
          }

          if (propInfo.type === 'upgrade') {
            return [{ propCase: getUpgradeCase(propInfo), invokeVerify: false }];
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
    let applicationCases = allCases.map(({ propCase }) => propCase);
    const deploy = findDeployInfo(this.contractInfo);
    if (deploy !== undefined) {
      applicationCases = applicationCases.concat(getDeployCase(deploy[0], deploy[1]));
    }
    const invocationVerifyCases = allCases.filter((propCase) => propCase.invokeVerify).map(({ propCase }) => propCase);
    const nonVerifyCases = allCases.filter((propCase) => !propCase.invokeVerify).map(({ propCase }) => propCase);

    const throwDefault = () => {
      sb.emitOp(node, 'DROP');
      sb.emitOp(node, 'ABORT');
    };

    const handleInvokeVerify = (func: () => void) => {
      sb.emitHelper(
        node,
        options,
        sb.helpers.if({
          condition: () => {
            // [boolean]
            sb.emitHelper(node, options, sb.helpers.applicationMatchesVerification);
            // [boolean, boolean]
            sb.emitOp(node, 'DUP');
          },
          whenTrue: () => {
            // [value, boolean]
            func();
            // [boolean]
            sb.emitOp(node, 'DROP');
          },
        }),
      );
    };

    const handleDefaultInvokeVerify = () => {
      // [number]
      sb.emitPushInt(node, 0);
      // [arg]
      sb.emitHelper(node, options, sb.helpers.getArgument);
      sb.emitHelper(node, options, sb.helpers.case(nonVerifyCases, throwDefault));
    };

    // [number]
    sb.emitSysCall(node, 'System.Runtime.GetTrigger');
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
              sb.emitPushInt(node, TriggerType.Application);
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
              sb.emitPushInt(node, TriggerType.Verification);
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
        ],
        throwDefault,
      ),
    );
  }
}
