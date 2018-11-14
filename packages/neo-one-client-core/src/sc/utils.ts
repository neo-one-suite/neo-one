import { ABIFunction } from '@neo-one/client-common';
import { upperCaseFirst } from '@neo-one/utils';

export const createForwardedValueFuncArgsName = (func: ABIFunction) => `forward${upperCaseFirst(func.name)}Args`;
export const createForwardedValueFuncReturnName = (func: ABIFunction) => `forward${upperCaseFirst(func.name)}Return`;
