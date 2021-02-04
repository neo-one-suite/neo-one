import { ContractProperties } from '../constants';
import { Context } from '../Context';
import { ContractInfo } from './ContractInfoProcessor';
import { ManifestSmartContractProcessor } from './ManifestSmartContractProcessor';

export const getManifest = (context: Context, contractInfo: ContractInfo, properties: ContractProperties) =>
  new ManifestSmartContractProcessor(context, contractInfo, properties).process();
