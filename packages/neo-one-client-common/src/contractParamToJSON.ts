import { JSONObject, utils } from '@neo-one/utils';
import { ContractParameter } from './types';

export const contractParamToJSON = (param: ContractParameter): JSONObject => {
  const type = param.type;
  switch (param.type) {
    case 'Signature':
    case 'Boolean':
    case 'Address':
    case 'Hash160':
    case 'Hash256':
    case 'Buffer':
    case 'PublicKey':
    case 'String':
      return {
        type,
        value: param.value,
      };
    case 'Integer':
      return {
        type,
        value: param.value.toString(),
      };
    case 'Array':
      return {
        type,
        value: param.value.map(contractParamToJSON),
      };
    case 'Map':
      return {
        type,
        value: param.value.map(([key, val]) => [contractParamToJSON(key), contractParamToJSON(val)]),
      };
    case 'Any':
    case 'InteropInterface':
    case 'Void':
      return {
        type,
      };
    default:
      utils.assertNever(param);
      throw new Error('For TS');
  }
};
