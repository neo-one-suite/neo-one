import { ABIFunction, ABIParameter } from '@neo-one/client-common';
import _ from 'lodash';
import { toTypeScriptType } from '../utils';

interface ParamAcc {
  readonly hasRequired: boolean;
  readonly acc: readonly string[];
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
  parameters: readonly ABIParameter[] = abi.parameters === undefined ? [] : abi.parameters,
  options: Options = {},
): readonly string[] => {
  const [otherParameters, restParameter]: [readonly ABIParameter[], ABIParameter | undefined] =
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
  let forwardOptions: readonly string[] = [];
  if (restParameter !== undefined && restParameter.type === 'ForwardValue') {
    forwardOptions = [`forwardOptions?: ${abi.constant ? 'ForwardOptions' : 'TForwardOptions'}`];
  }
  const withParamOptions = paramStrings
    .concat(paramOptions)
    .concat(restParameter === undefined ? [] : [getRestParameter(restParameter)])
    .join(', ');
  const withForwardOptions = paramStrings
    .concat(forwardOptions)
    .concat(restParameter === undefined ? [] : [getRestParameter(restParameter)])
    .join(', ');
  const withParamForwardOptions = paramStrings
    .concat(paramOptions)
    .concat(forwardOptions)
    .concat(restParameter === undefined ? [] : [getRestParameter(restParameter)])
    .join(', ');
  const withoutOptions = paramStrings
    .concat(restParameter === undefined ? [] : [getRestParameter(restParameter)])
    .join(', ');

  if (restParameter === undefined) {
    return [withParamOptions];
  }

  if (paramOptions.length === 0) {
    return forwardOptions.length === 0 ? [withoutOptions] : [withForwardOptions];
  }

  return forwardOptions.length === 0
    ? [withParamOptions, withoutOptions]
    : [withForwardOptions, withParamForwardOptions];
};
