import { Context } from '../Context';
import { ContractInfo } from './ContractInfoProcessor';
import { DebugInfoProcessor } from './DebugInfoProcessor';

export const getDebugInfo = (context: Context, contractInfo: ContractInfo) =>
  new DebugInfoProcessor(context, contractInfo).process();
