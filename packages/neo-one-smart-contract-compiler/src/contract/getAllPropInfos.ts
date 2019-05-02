import { ContractInfo, PropInfo } from './ContractInfoProcessor';

export const getAllPropInfos = (contractInfo: ContractInfo): readonly PropInfo[] =>
  contractInfo.propInfos.concat(
    contractInfo.superSmartContract === undefined ? [] : getAllPropInfos(contractInfo.superSmartContract),
  );
