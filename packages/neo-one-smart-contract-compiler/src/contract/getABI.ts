import { Context } from '../Context';
import { ABISmartContractProcessor } from './ABISmartContractProcessor';
import { ContractInfo } from './ContractInfoProcessor';

export const getABI = (context: Context, contractInfo: ContractInfo) =>
  new ABISmartContractProcessor(context, contractInfo).process();
