import { tsUtils } from '@neo-one/ts-utils';
import ts from 'typescript';
import { ContractInfo, DeployPropInfo } from '../../../contract';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';

export const createWrapParam =
  (sb: ScriptBuilder) =>
  (param: ts.ParameterDeclaration | ts.ParameterPropertyDeclaration, innerOptions: VisitOptions) => {
    let type = sb.context.analysis.getType(param);
    if (type !== undefined && tsUtils.parameter.isRestParameter(param)) {
      type = tsUtils.type_.getArrayType(type);
    }

    sb.emitHelper(
      param,
      innerOptions,
      sb.helpers.wrapValRecursive({
        type,
        checkValue: true,
        optional: tsUtils.initializer.getInitializer(param) !== undefined,
      }),
    );
  };

export const findSuperDeployPropInfo = (
  contractInfo: ContractInfo,
): readonly [ContractInfo, DeployPropInfo] | undefined => {
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

export const findDeployInfo = (contractInfo: ContractInfo): readonly [ContractInfo, DeployPropInfo] | undefined => {
  const deployInfo = contractInfo.propInfos.find((propInfo): propInfo is DeployPropInfo => propInfo.type === 'deploy');

  return deployInfo === undefined ? findSuperDeployPropInfo(contractInfo) : [contractInfo, deployInfo];
};
