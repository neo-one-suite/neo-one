import { ABIFunction } from '@neo-one/client-core';
import _ from 'lodash';
import { toTypeScriptType } from '../utils';

interface ParamAcc {
  readonly hasRequired: boolean;
  readonly acc: ReadonlyArray<string>;
}

const getOptions = (abi: ABIFunction) => {
  if (abi.constant) {
    return [];
  }

  if (abi.send && abi.receive) {
    return ['options?: InvokeSendReceiveTransactionOptions'];
  }

  if (abi.send) {
    return ['options?: InvokeSendTransactionOptions'];
  }

  if (abi.receive) {
    return ['options?: InvokeReceiveTransactionOptions'];
  }

  if (abi.claim) {
    return ['options?: InvokeClaimTransactionOptions'];
  }

  return ['options?: TransactionOptions'];
};

export const genFunctionParameters = (abi: ABIFunction): string =>
  _.reverse(
    _.reverse([...(abi.parameters === undefined ? [] : abi.parameters)]).reduce<ParamAcc>(
      (acc, param) => ({
        hasRequired: acc.hasRequired || !param.optional,
        acc: acc.acc.concat(
          `${param.name}${!acc.hasRequired && param.optional ? '?' : ''}: ${toTypeScriptType(param, false)}`,
        ),
      }),
      { hasRequired: false, acc: [] },
    ).acc,
  )
    .concat(getOptions(abi))
    .join(', ');
