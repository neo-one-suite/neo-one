import { ABIFunction, ABIParameter } from '@neo-one/client-core';
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

  if (abi.sendUnsafe && abi.receive) {
    return [`options?: InvokeSendUnsafeReceiveTransactionOptions${type}`];
  }

  if (abi.sendUnsafe) {
    return [`options?: InvokeSendUnsafeTransactionOptions${type}`];
  }

  if (abi.receive) {
    return [`options?: InvokeReceiveTransactionOptions${type}`];
  }

  if (abi.refundAssets) {
    return [`hash: Hash256String, options?: TransactionOptions${type}`];
  }

  if (abi.send) {
    return [`transfer: Transfer, options?: TransactionOptions${type}`];
  }

  if (abi.completeSend) {
    return [`hash: Hash256String, options?: TransactionOptions${type}`];
  }

  return [`options?: TransactionOptions${type}`];
};

const getRestParameter = (param: ABIParameter) =>
  `...${param.name}: ${toTypeScriptType(param, { isParameter: true, includeOptional: false })}[]`;

export const genFunctionParameters = (
  abi: ABIFunction,
  parameters: ReadonlyArray<ABIParameter> = abi.parameters === undefined ? [] : abi.parameters,
  options: Options = {},
): ReadonlyArray<string> => {
  const [otherParameters, restParameter]: [ReadonlyArray<ABIParameter>, ABIParameter | undefined] =
    parameters.length > 0 && parameters[parameters.length - 1].rest
      ? [parameters.slice(0, -1), parameters[parameters.length - 1]]
      : [parameters.slice(), undefined];
  const paramStrings = _.reverse(
    _.reverse([...otherParameters]).reduce<ParamAcc>(
      (acc, param) => ({
        hasRequired: acc.hasRequired || !param.optional,
        acc: acc.acc.concat(
          `${param.name}${!acc.hasRequired && param.optional ? '?' : ''}: ${toTypeScriptType(param, {
            isParameter: true,
            includeOptional: false,
          })}`,
        ),
      }),
      { hasRequired: false, acc: [] },
    ).acc,
  );

  const paramOptions = getOptions(abi, options);
  const withOptions = paramStrings
    .concat(paramOptions)
    .concat(restParameter === undefined ? [] : [getRestParameter(restParameter)])
    .join(', ');
  const withoutOptions = paramStrings
    .concat(restParameter === undefined ? [] : [getRestParameter(restParameter)])
    .join(', ');

  if (restParameter === undefined) {
    return [withOptions];
  }

  if (paramOptions.length === 0) {
    return [withoutOptions];
  }

  return [withOptions, withoutOptions];
};
