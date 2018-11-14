import { ContractInfo, PropInfo } from './ContractInfoProcessor';

export const getAllPropInfos = (contractInfo: ContractInfo): ReadonlyArray<PropInfo> =>
  contractInfo.propInfos.concat(
    contractInfo.superSmartContract === undefined ? [] : getAllPropInfos(contractInfo.superSmartContract),
  );
