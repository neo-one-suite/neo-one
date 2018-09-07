import { ABIFunction } from '@neo-one/client-core';
import _ from 'lodash';
import { toTypeScriptType } from '../utils';

interface ParamAcc {
  readonly hasRequired: boolean;
  readonly acc: ReadonlyArray<string>;
}

interface Options {
  readonly withConfirmedOptions?: boolean;
}

const getOptions = (abi: ABIFunction, { withConfirmedOptions = false }: Options = {}) => {
  if (abi.constant) {
    return withConfirmedOptions ? ['options?: GetOptions'] : [];
  }

  const type = withConfirmedOptions ? '& GetOptions' : '';

  if (abi.send && abi.receive) {
    return [`options?: InvokeSendReceiveTransactionOptions${type}`];
  }

  if (abi.send) {
    return [`options?: InvokeSendTransactionOptions${type}`];
  }

  if (abi.receive) {
    return [`options?: InvokeReceiveTransactionOptions${type}`];
  }

  if (abi.claim) {
    return [`options?: InvokeClaimTransactionOptions${type}`];
  }

  return [`options?: TransactionOptions${type}`];
};

export const genFunctionParameters = (abi: ABIFunction, options: Options = {}): string =>
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
    .concat(getOptions(abi, options))
    .join(', ');
