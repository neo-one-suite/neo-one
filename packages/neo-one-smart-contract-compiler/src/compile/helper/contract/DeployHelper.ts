import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ContractInfo, DeployPropInfo } from '../../../contract';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';
import { createWrapParam, findSuperDeployPropInfo } from './utils';

export interface DeployHelperOptions {
  readonly contractInfo: ContractInfo;
  readonly propInfo: DeployPropInfo;
}

// Input: []
// Output: [boolean]
export class DeployHelper extends Helper {
  private readonly contractInfo: ContractInfo;
  private readonly propInfo: DeployPropInfo;

  public constructor({ contractInfo, propInfo }: DeployHelperOptions) {
    super();
    this.contractInfo = contractInfo;
    this.propInfo = propInfo;
  }

  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);

    const handleDeployProperties = (contractInfo: ContractInfo, innerOptions: VisitOptions) => {
      contractInfo.propInfos
        .filter((prop) => prop.classDecl === contractInfo.smartContract)
        .forEach((propertyPropInfo) => {
          if (propertyPropInfo.type === 'property' && propertyPropInfo.structuredStorageType === undefined) {
            const property = propertyPropInfo.decl;
            if (ts.isPropertyDeclaration(property)) {
              const initializer = tsUtils.initializer.getInitializer(property);
              const propNode = initializer === undefined ? property : initializer;
              if (initializer === undefined) {
                sb.emitHelper(propNode, sb.pushValueOptions(innerOptions), sb.helpers.wrapUndefined);
              } else {
                // [val]
                sb.visit(initializer, sb.pushValueOptions(innerOptions));
              }
              // [name, val]
              sb.emitPushString(property, tsUtils.node.getName(property));
              // []
              sb.emitHelper(property, innerOptions, sb.helpers.putCommonStorage);
            } else if (ts.isParameterPropertyDeclaration(property, property.parent)) {
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
              mapParam: entry ? createWrapParam(sb) : undefined,
            }),
          );

          const invokeOptions = sb.handleSuperConstructOptions(
            sb.noPushValueOptions(innerInnerOptions),
            (expr, _superExpr, innerInnerInnerOptionsIn) => {
              if (superDeploy === undefined) {
                return;
              }

              const innerInnerInnerOptions = sb.pushValueOptions(innerInnerInnerOptionsIn);
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

    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [boolean]
          sb.emitHelper(this.propInfo.decl === undefined ? node : this.propInfo.decl, options, sb.helpers.isDeployed);
        },
        whenTrue: () => {
          // [boolean]
          sb.emitPushBoolean(this.propInfo.decl === undefined ? this.propInfo.classDecl : this.propInfo.decl, false);
        },
        whenFalse: () => {
          // []
          handleDeploy(this.contractInfo, this.propInfo, options);
          // []
          sb.emitHelper(this.propInfo.decl === undefined ? node : this.propInfo.decl, options, sb.helpers.setDeployed);
          // [boolean]
          sb.emitPushBoolean(this.propInfo.decl === undefined ? this.propInfo.classDecl : this.propInfo.decl, true);
        },
      }),
    );

    // TODO: this is a quick fix for a floating empty args array
    sb.emitHelper(
      node,
      options,
      sb.helpers.if({
        condition: () => {
          // [size, ...stack]
          sb.emitOp(node, 'DEPTH');
          // [1, size, ...stack]
          sb.emitPushInt(node, 1);
          // [size > 1, ...stack]
          sb.emitOp(node, 'GT');
        },
        whenTrue: () => {
          // [args, boolean]
          sb.emitOp(node, 'SWAP');
          // [boolean]
          sb.emitOp(node, 'DROP');
        },
      }),
    );
  }
}
